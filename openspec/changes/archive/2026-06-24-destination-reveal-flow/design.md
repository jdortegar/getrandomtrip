# Design: Destination Reveal Flow

## Architecture Overview

Time-driven reveal pipeline built on the EXISTING Netlify-scheduled-function → authenticated-internal-route pattern (`xsed-notify.ts` → `POST /api/internal/xsed/notify`). One hourly cron triggers one internal route that runs two independent, idempotent passes over `CONFIRMED` trips. No new infrastructure, no new env vars — `CRON_SECRET`, `Notification`, and the email layer all already exist.

```
┌──────────────────────────────┐      Bearer CRON_SECRET       ┌───────────────────────────────────────┐
│ netlify/functions/            │  POST /api/internal/          │ src/app/api/internal/                  │
│   destination-reveal.ts       │ ────reveal──────────────────► │   destination-reveal/route.ts          │
│   schedule: "0 * * * *"       │                               │   Pass 1 (T-72h): admin reminder       │
│   (mirror of xsed-notify.ts)  │                               │   Pass 2 (T-48h): auto-reveal          │
└──────────────────────────────┘                               └───────────────┬───────────────────────┘
                                                                                 │
                          ┌──────────────────────────────────────────────────────┼─────────────────────────────┐
                          ▼                                                        ▼                             ▼
            prisma.notification.create (ADMIN)                  sendDestinationAssignmentReminder      sendDestinationRevealed
            + stamp destinationAssignmentNotifiedAt             (new admin email)                      (existing, CTA retargeted)
                          │
                          ▼
            TripRequest.status: CONFIRMED → REVEALED + destinationRevealedAt

Client side:
  /{locale}/dashboard/trips/[id]/reveal  ── fetch ──►  GET /api/trips/[id] (experience media added)
        pre-reveal: countdown to startDate − 48h
        post-reveal: hero(heroImage) + destination + "Ver Itinerario" CTA → /dashboard/trips/[id]/details
  Dashboard cards (UpcomingTripsPanel, AllTripsGrid): conditional reveal link for CONFIRMED/REVEALED
```

## Pattern & Layering

- **Boundary**: Reuse, do not invent. The scheduler is a thin fetch wrapper (identical shape to `xsed-notify.ts`); all logic lives in the route handler so it is unit-testable with vitest + happy-dom without Netlify.
- **Auth**: identical `isAuthorized(request)` guard from `xsed/notify/route.ts` — compares `Authorization` header to `Bearer ${CRON_SECRET}`. No NextAuth session on internal routes.
- **Email**: new `sendDestinationAssignmentReminder` added to `src/lib/email/index.ts` following the existing fire-and-forget `void (async () => {...})()` convention used by every other `send*` function.
- **Notifications**: `prisma.notification.create` with `audience: "ADMIN"` and an existing `NotificationType` value (`BOOKING_CONFIRMED` is the closest existing fit; see ADR-006 — no new `NotificationType` is added in this change).
- **Reveal page**: client component under the `(secure)` route group, matching the sibling `trips/[id]/page.tsx` structure (`SecureRoute` wrapper, `useParams`, `getDictionary`, `HeaderHero`).

## Components & Data Flow

### 1. Cron endpoint — `POST /api/internal/destination-reveal`

Two sequential passes inside one handler. Each pass is self-contained and idempotent; a pass failure must not abort the other.

**Pass 1 — T-72h admin assignment reminder**

```
now = new Date()
threshold72 = now + 72h
candidates = tripRequest.findMany({
  where: {
    status: "CONFIRMED",
    startDate: { lte: threshold72, gte: now },   // window: due within 72h, not already past
    destinationAssignmentNotifiedAt: null,        // idempotency guard
  },
  select: { id, type, level, startDate, originCity, originCountry, experienceId },
})
admins = user.findMany({ where: { roles: { has: "ADMIN" } }, select: { id, email, name, locale } })
for each candidate:
  for each admin: notification.create({ userId: admin.id, audience: "ADMIN", type: "BOOKING_CONFIRMED", title, body, metadata: { tripRequestId } })
  sendDestinationAssignmentReminder(tripRequestId)   // emails admins (see ADR-005)
  tripRequest.update({ where: { id }, data: { destinationAssignmentNotifiedAt: now } })  // stamp AFTER side-effects
```

The stamp is the idempotency key. Setting it last means a crash mid-pass re-escalates next hour (at-least-once delivery, acceptable for an internal reminder). Trips that already have an experience are still reminded — admins may still want to swap/verify; this keeps Pass 1 logic dead-simple and the proposal explicitly allows re-escalation.

**Pass 2 — T-48h client auto-reveal**

```
threshold48 = now + 48h
revealable = tripRequest.findMany({
  where: {
    status: "CONFIRMED",                 // status itself is the idempotency guard — REVEALED rows are excluded
    startDate: { lte: threshold48, gte: now },
    experienceId: { not: null },         // only reveal when a destination exists
  },
  select: { id, userId, experienceId },
})
for each:
  // resolve destination from the assigned experience; write actualDestination so the existing reveal email/UI works
  experience = experience.findUnique({ where: { id: experienceId }, select: { destinationCity, destinationCountry } })
  tripRequest.update({
    where: { id, status: "CONFIRMED" },  // guarded update — see ADR-002
    data: { status: "REVEALED", destinationRevealedAt: now, actualDestination: `${city}, ${country}` (if not already set) },
  })
  sendDestinationRevealed(tripRequestId, userId)
```

`CONFIRMED` trips WITHOUT an `experienceId` are simply skipped by Pass 2; they remain `CONFIRMED` and re-surface in Pass 1 each hour (because Pass 1's window keeps matching) — but only re-notify if `destinationAssignmentNotifiedAt` is null. To force re-escalation for un-assigned trips inside the 72h window, Pass 1 also clears nothing; the proposal's "re-escalate each pass" is satisfied by a SECOND escalation rule (see ADR-004): if `startDate <= now+48h` AND `experienceId IS NULL` AND already notified, re-notify and re-stamp. This is the only place Pass 1 re-fires.

**Error handling**: wrap each candidate in try/catch, accumulate counters, return `{ remindersSent, revealed, errors }` JSON. Top-level try/catch returns 500 with message (mirrors `xsed/notify`). Per-row failures are logged with `[destination-reveal]` prefix and do not abort the loop.

**Response contract**: `200 { pass1: { reminded, escalated }, pass2: { revealed }, errors: [...] }`. `401` when unauthorized, `500` on unhandled error.

### 2. Netlify scheduled function — `netlify/functions/destination-reveal.ts`

Byte-for-byte the `xsed-notify.ts` shape, only the schedule and target URL change:

```ts
export const config: Config = { schedule: "0 * * * *" }; // top of every hour, UTC
// fetch(`${siteUrl}/api/internal/destination-reveal`, { method: "POST", headers: { Authorization: `Bearer ${secret}` } })
// siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL
```

No change to `netlify.toml` — `[functions] directory = "netlify/functions"` already auto-registers any file in that folder. (Documented in rollback: removing the file disables the cron.)

### 3. Schema migration — `prisma/schema.prisma`

```prisma
model TripRequest {
  // ... existing fields
  destinationAssignmentNotifiedAt DateTime? // T-72h admin reminder idempotency stamp
}

enum NotificationAudience {
  TRIPPER
  CLIENT
  ADMIN   // additive — existing rows unaffected
}
```

Both changes are additive and nullable → safe on prod with `db push` / `migrate`. No backfill. Rollback drops the column; the enum value is safe to leave.

### 4. Reveal page — `src/app/[locale]/(secure)/dashboard/trips/[id]/reveal/page.tsx`

Client component, same skeleton as the sibling `trips/[id]/page.tsx`:

- `SecureRoute` wrapper + `dynamic(..., { ssr: false })` (matches sibling — avoids hydration of auth-gated content).
- Fetch `GET /api/trips/[id]`; ownership already enforced server-side (403 on mismatch).
- **Pre-reveal state** (`status === "CONFIRMED"`): countdown component ticking to `revealAt = startDate − 48h`. If `revealAt` is already past but status still `CONFIRMED` (assignment pending), show a "destino en preparación" message instead of a negative timer.
- **Post-reveal state** (`status === "REVEALED" | "COMPLETED"`): `HeaderHero` using `experience.heroImage` as `fallbackImage`, destination name as title, and a primary "Ver Itinerario" CTA → `/{locale}/dashboard/trips/[id]/details`.
- **Countdown logic**: pure helper `getRevealCountdown(startDate: Date, now: Date)` extracted to `src/lib/helpers/` so it is unit-testable (strict TDD). Returns `{ revealed: boolean, days, hours, minutes, seconds }`. A `useEffect` + `setInterval(1000)` drives re-render; helper itself is deterministic.
- All copy from a new `tripReveal` dictionary section (es + en).

### 5. Experience media on reveal page — `GET /api/trips/[id]`

The existing route's `experience` select omits the cover image and destination. Extend the existing `include.experience.select` (NO new endpoint, NO shape break):

```ts
experience: {
  select: {
    id: true, title: true, itinerary: true, inclusions: true, exclusions: true, // existing
    heroImage: true,            // NEW — reveal hero background
    destinationCity: true,      // NEW — destination display + actualDestination fallback
    destinationCountry: true,   // NEW
  },
},
```

`actualDestination` is written by Pass 2, so the reveal page prefers `trip.actualDestination` and falls back to `experience.destinationCity, destinationCountry`. Additive select fields are backward-compatible with the existing trip-detail page.

### 6. New email — `src/emails/DestinationAssignmentReminder.tsx` + `sendDestinationAssignmentReminder`

- React-email template mirroring `AdminNewBooking.tsx` structure (admin-facing, single locale acceptable but we localize via the `resolveLocale(admin.locale)` pattern for consistency).
- Recipient: ALL users with `roles has ADMIN` (loop), NOT the static `ADMIN_EMAIL` env — the reminder is operational and per-admin in-app notifications already target each admin; email mirrors that audience. (See ADR-005.)
- Content: client/trip summary (type, level, origin, startDate, hours-until-departure) + admin CTA → `/{locale}/dashboard/admin/...` assignment screen. CTA target: the admin trip/experience assignment view. If a canonical admin assignment URL does not yet exist, the CTA points to the admin dashboard root `/{locale}/dashboard` — documented as a follow-up, out of scope to build the assignment screen here.
- `subjects = { es, en }` export, consumed by `sendDestinationAssignmentReminder`.

### 7. Email CTA update — `DestinationRevealed.tsx` + `sendDestinationRevealed`

Problem: line 57 `ctaHref = \`${BASE_URL}/${locale}/dashboard\`` — generic, no trip context.

Fix: thread the `tripRequestId` through to the template.

```ts
// DestinationRevealed.tsx
interface DestinationRevealedProps { ...; tripId: string; }
const ctaHref = `${BASE_URL}/${locale}/dashboard/trips/${tripId}/reveal`;
```

`sendDestinationRevealed(tripRequestId, userId)` already has `tripRequestId` in scope — pass it as the new `tripId` prop in the `React.createElement(DestinationRevealed, { ... tripId: tripRequestId })` call. No signature change to `sendDestinationRevealed`. The Pass-2 caller already passes `tripRequestId`.

### 8. Dead code cleanup

Delete exactly:
- `src/app/[locale]/(secure)/reveal-destination/page.tsx`
- `src/app/[locale]/(secure)/reveal-destination/RevealDestinationClient.tsx`
- (the whole `reveal-destination/` directory)
- `src/app/api/bookings/route.ts` (and `bookings/` dir if empty after)
- Remove `"/reveal-destination"` from `SECURE_PATH_PREFIXES` in `src/lib/helpers/secureClientPaths.ts`.

Before deletion (apply phase): `rg -F "reveal-destination"` and `rg -F "api/bookings"` to confirm zero remaining references.

### 9. Dashboard entry points

`UpcomingTripsPanel.tsx` and `AllTripsGrid.tsx` both render a "Ver detalles" CTA → `/dashboard/trips/${trip.id}`. Add a second conditional reveal link:

- **Condition**: `trip.status === "CONFIRMED" || trip.status === "REVEALED"`.
- **Link**: → `/dashboard/trips/${trip.id}/reveal`.
- **Label**: `CONFIRMED` → countdown label (e.g. "Cuenta regresiva"); `REVEALED` → reveal label (e.g. "Ver destino"). Both new dictionary keys (es + en).
- Use existing `<Button asChild size="sm" variant="ghost">` + `lucide-react` icon (e.g. `Clock` pre-reveal, `Sparkles`/`Eye` post-reveal), consistent with the existing card action style.
- `AllTripsGrid` currently filters to `COMPLETED` only — CONFIRMED/REVEALED trips never appear there, so the reveal link effectively lands in `UpcomingTripsPanel`. Add the link to both for safety/consistency, but the live entry point is `UpcomingTripsPanel`.

## ADR-style Decisions

### ADR-001 — Single hourly cron, two passes, one route
**Decision**: One `0 * * * *` Netlify function calling one internal route that runs both passes.
**Rationale**: Mirrors the proven `xsed-notify` pattern; hourly granularity is sufficient for ±1h reveal precision on a 48h horizon. One route = one auth surface, one deploy artifact, one test file.
**Rejected**: Two separate functions/routes (more surface, duplicated auth); per-minute cron (wasteful, Netlify scheduled-function quotas); DB-level pg_cron (no Prisma access to app email/notification helpers).

### ADR-002 — Idempotency via status guard + timestamp stamp
**Decision**: Pass 2 uses a guarded update (`where: { id, status: "CONFIRMED" }`); Pass 1 uses `destinationAssignmentNotifiedAt` null-check then stamp.
**Rationale**: Protects against cron double-fire and concurrent admin manual reveal. The guarded `updateMany`/`update` is atomic at the DB row level — a second fire updates 0 rows.
**Rejected**: Advisory locks (overkill); in-memory dedup (lost across function invocations).

### ADR-003 — Reveal logic in route handler, scheduler is a dumb wrapper
**Decision**: Scheduler only does auth-fetch; all branching lives in the route.
**Rationale**: Strict TDD is enabled (vitest, happy-dom). Route handlers and the countdown helper are unit-testable without the Netlify runtime; the scheduler has nothing worth testing.
**Rejected**: Logic in the Netlify function (untestable in this stack, no Prisma client wiring there).

### ADR-004 — Un-assigned trips re-escalate inside 48h
**Decision**: Pass 1 re-notifies an already-stamped trip ONLY when `experienceId IS NULL` AND `startDate <= now+48h`, then re-stamps.
**Rationale**: A trip with no experience at T-48h is an operational emergency — it cannot auto-reveal. One extra escalation is justified. Outside this, the null-check prevents reminder spam.
**Rejected**: Re-notify every hour (spam); never re-notify (silent failure when assignment is forgotten).

### ADR-005 — Admin reminder targets all ADMIN users, not ADMIN_EMAIL
**Decision**: Loop `user.findMany({ where: { roles: { has: "ADMIN" } } })` for both in-app notifications and emails.
**Rationale**: The new `ADMIN` audience on `Notification` is per-user; emailing the same audience keeps in-app and email consistent. `ADMIN_EMAIL` is a single inbox used for transactional admin alerts (`AdminNewBooking`); the reveal reminder is an assignment task each admin can own.
**Rejected**: Static `ADMIN_EMAIL` (inconsistent with the per-admin in-app notification, can't be silenced per-admin later).

### ADR-006 — Reuse existing NotificationType, add only the ADMIN audience
**Decision**: No new `NotificationType` enum value; use `BOOKING_CONFIRMED`. Only add `ADMIN` to `NotificationAudience`.
**Rationale**: Minimizes schema surface. The proposal explicitly scopes the enum change to `NotificationAudience` only. The notification's `audience: "ADMIN"` + title/body already differentiate it in the admin notifications UI.
**Rejected**: New `DESTINATION_ASSIGNMENT_REMINDER` type (out of proposal scope; would touch the notification-type UI mapping). Flag for a follow-up if admins need type-level filtering.

### ADR-007 — Reuse GET /api/trips/[id], extend the experience select
**Decision**: Add `heroImage`, `destinationCity`, `destinationCountry` to the existing `include.experience.select`. No new endpoint.
**Rationale**: Additive select fields are backward-compatible; the reveal page is just another consumer of the owned-trip read. Ownership/auth already enforced.
**Rejected**: New `/api/trips/[id]/reveal` endpoint (duplicate auth + ownership logic); embedding media in a server component fetch (the sibling page is client-rendered `ssr:false`, keep consistent).

### ADR-008 — Reveal page reads actualDestination first, experience second
**Decision**: Display `trip.actualDestination` when set (Pass 2 writes it), else compose from `experience.destinationCity/Country`.
**Rationale**: `actualDestination` is the canonical revealed value already consumed by `DestinationRevealed` email and trip cards; experience fields are the fallback when Pass 2 hasn't run or wrote nothing.
**Rejected**: Always recompute from experience (diverges from email/card source of truth).

## Risks & Open Questions

| Risk / Question | Impact | Mitigation / Resolution |
|---|---|---|
| Admin assignment screen URL unknown | Med | Reminder CTA falls back to `/{locale}/dashboard` until a canonical assignment route exists. Flagged as follow-up; not in scope. |
| `NotificationType` reused (`BOOKING_CONFIRMED`) may mislabel in admin UI | Low | Title/body carry the real meaning; ADR-006 flags a typed enum as a follow-up. |
| Pass ordering: a trip could be reminded (Pass 1) and revealed (Pass 2) in the same run if it crosses both windows | Low | Acceptable — reminder + reveal in one hour is benign; admin sees both. If undesired, Pass 2 can run first. Decided Pass 1 first per proposal order. |
| Reveal precision is ±1h (hourly cron) | Low | Acceptable per proposal; countdown UI shows live seconds independent of cron. |
| Timezone of `startDate` vs UTC `now` | Med | `startDate` is a `DateTime` (UTC in Postgres); all window math in UTC. Countdown renders in client local time via `toLocaleString`. Verify in tests with fixed UTC clock. |
| Deleting `reveal-destination` route while referenced | Low | Apply phase greps `reveal-destination` and `api/bookings` for zero refs before deletion. |

## Files Touched (for tasks phase)

| File | Action |
|---|---|
| `prisma/schema.prisma` | Modify — field + enum value |
| `netlify/functions/destination-reveal.ts` | New — hourly scheduler |
| `src/app/api/internal/destination-reveal/route.ts` | New — two-pass cron logic |
| `src/app/api/trips/[id]/route.ts` | Modify — extend experience select |
| `src/app/[locale]/(secure)/dashboard/trips/[id]/reveal/page.tsx` | New — reveal page |
| `src/lib/helpers/<revealCountdown>.ts` | New — pure countdown helper (TDD) |
| `src/emails/DestinationAssignmentReminder.tsx` | New — admin reminder email |
| `src/emails/DestinationRevealed.tsx` | Modify — `tripId` prop + CTA href |
| `src/lib/email/index.ts` | Modify — add `sendDestinationAssignmentReminder`; pass `tripId` in `sendDestinationRevealed` |
| `src/components/app/dashboard/UpcomingTripsPanel.tsx` | Modify — conditional reveal link |
| `src/components/app/dashboard/AllTripsGrid.tsx` | Modify — conditional reveal link |
| `src/lib/helpers/secureClientPaths.ts` | Modify — drop `/reveal-destination` |
| `src/app/[locale]/(secure)/reveal-destination/` | Delete — dead code |
| `src/app/api/bookings/route.ts` | Delete — dead stub |
| `src/dictionaries/es.json`, `en.json` | Modify — `tripReveal` section + card labels |
| `src/lib/types/dictionary.ts` | Modify — `TripRevealDict` interface |
