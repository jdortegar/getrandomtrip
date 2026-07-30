# Design: Invite Travel Friends — Post-Payment Companion Data Collection

## Technical Approach

Add one FK-owned `TripTraveler` roster model and thread it through five existing precedents the exploration
mapped — the `tripperInviteTokens.ts` hash-in-DB token idiom, the `TripperInvite.tsx` inline-copy email
pattern, the `destination-reveal` two-pass `CRON_SECRET` job, the `tripper-invite` server-peek → client-form
landing, and the checkout/dashboard read surfaces — inventing zero new infrastructure. Six layers:

1. **Data** — new `TripTraveler` (FK `TripRequest`, token fields **inline** per confirmed decision), `TravelerKind`/`TravelerStatus` enums, `TRAVELER_SUBMITTED` `NotificationType`, `travelersLockedAt` stamp on `TripRequest`. Shipped via `npm run db:push` (this repo has **no** migration files — `db:migrate` is aliased to `prisma db push`; `prisma/migrations/` holds only `.gitkeep`). Additive → no backfill.
2. **Token core** — new `src/lib/travelers/travelerInviteTokens.ts` forks `tripperInviteTokens.ts` (`issue`/`peek`/`consume`), but keyed on `travelerId` and **rotated in place** on the owner row (no delete-then-create transaction — 1:1 cardinality).
3. **Roster core** — new `src/lib/travelers/travelerRoster.ts`: one `getRosterForTrip(tripId)` that lazily materializes PENDING rows (idempotent, gated on paid) AND serializes them. Consumed by **both** read routes — the single drift-proof shape.
4. **Write routes** — buyer edit + resend-invite (session-guarded, server cutoff-locked) and a public `submit-from-token`.
5. **Email + job** — `TravelerInvite`/`TravelerReminder` templates + senders; `traveler-reminder` Netlify function → `CRON_SECRET`-guarded internal route with `runPass1` (reminders) / `runPass2` (cutoff lock).
6. **UI + i18n** — shared `TravelerRosterSection` on success page + dashboard, `/invite/[token]` landing, new `inviteTravelers` dictionary section, `src/types/traveler.ts`.

**Cutoff = `TripRequest.startDate − 7 days`** (confirmed decision #2). Token TTL 7 days like the idiom; submit re-checks cutoff independently, so a still-valid token past cutoff is still rejected.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Token storage | **Inline on `TripTraveler`** (`inviteTokenHash @unique`, `inviteTokenExpiresAt`, `invitedAt`, `submittedAt`, `consentAt`) | Separate `TripTravelerInvite` table (the `TripperInvite`/`VerificationToken` shape) | Confirmed decision. Cardinality is 1:1 with a persistent owner row, unlike the ownerless token tables. Replay-safety comes free by rotating the hash in place on resend (old hash stops matching). No join on every roster read. |
| Reissue / rotate | `update` the row: overwrite `inviteTokenHash`, bump `invitedAt`, clear `reminderSentAt`, status → `INVITED` | `$transaction` delete-then-create (the `issueTripperInvite` dance) | No separate rows exist, so nothing to delete. Single `update` is atomic and invalidates the prior link instantly. |
| Roster creation hook | **Lazy + idempotent** inside `getRosterForTrip`, gated on `payment.status === "APPROVED"` | Create rows in the Stripe `webhook` on `payment_intent.succeeded` | The webhook has no session/locale and must stay payment-only; both read surfaces already require a paid trip; lazy-ensure guarantees existence at first view and is naturally idempotent. No UI visit ⇒ no invites needed, so nothing is lost. |
| Shared read path | ONE `getRosterForTrip(tripId)` → `{ deadline, locked, cap, submitted, travelers[] }`, called by `trip-summary` **and** `/api/trips/[id]` | Each route serializes its own traveler shape | Directly kills the shape-drift risk the exploration flagged (see note below). |
| Row component | Single `TravelerRow` with a `kind` discriminator | Separate `AdultTravelerRow` / `MinorTravelerRow` files | ~80% shared scaffold (name, id/passport, status pill, lock state, layout); adult adds email + invite button, minor swaps in DOB. Two files would duplicate the wrapper and lock logic. Branch the ~20% delta, share the rest. |
| Status badge | New `TravelerStatusBadge` in `src/components/common/` mirroring `ExperienceStatusBadge` (rounded-[6px] + dot) | Inline chip; reuse `ExperienceStatusBadge` (enum-typed to experience statuses) | `design-system.md` forbids inline badge styles; `ExperienceStatusBadge` is typed to a different enum. New sibling keeps the exact shape without widening the existing one. |
| Landing route | `/[locale]/invite/[token]/page.tsx` **path param** (server peek → client form) | `?token=` query like `tripper-invite` | Brief specifies path segment; otherwise identical server-peek-never-consume → client-POST-consume structure. |
| Schema delivery | Edit `schema.prisma`, `npm run db:push` | `prisma migrate dev` migration file | Same call as `tripper-invite` / `auth-verification-reset`; a lone migration would fracture the `db push` workflow. |

## Data Flow

```
CREATE (lazy)  success page | dashboard → GET trip-summary | /api/trips/[id]
    → getRosterForTrip(tripId)  [if paid & rows < cap: create PENDING adult/minor rows]
    → serialized roster { deadline, locked, cap, submitted, travelers[] }

BUYER EDITS   PATCH /api/travelers/[id]        (session owns trip, not locked) → COMPLETE if all fields present
SEND INVITE   POST  /api/travelers/[id]/invite (adult+email, not locked)
    → issueTravelerInvite(id) [rotate hash inline] → sendTravelerInviteEmail(id) → status INVITED

COMPANION     /[locale]/invite/[token]  (server peek → client form, destination NOT revealed)
    → POST /api/travelers/submit { token, fullName, idDocument, consent }   (public, no auth)
    → consumeTravelerInvite(token, data) [re-check expiry + cutoff, write fields, submittedAt, consentAt, status COMPLETE]
    → Notification TRAVELER_SUBMITTED → buyer  (+ optional email)

CRON (hourly) netlify/traveler-reminder → POST /api/internal/traveler-reminder (Bearer CRON_SECRET)
    Pass1: INVITED rows in reminder window, reminderSentAt null → sendTravelerReminderEmail + stamp
    Pass2: paid trips at startDate−7d, travelersLockedAt null → stamp travelersLockedAt (roster locks)
```

## Interfaces / Contracts

### Prisma (`prisma/schema.prisma`)
```prisma
enum TravelerKind   { ADULT MINOR }
enum TravelerStatus { PENDING INVITED COMPLETE }
// NotificationType += TRAVELER_SUBMITTED
// TripRequest += travelers TripTraveler[]  +  travelersLockedAt DateTime?  (Pass-2 idempotency stamp)

model TripTraveler {
  id            String         @id @default(cuid())
  tripRequestId String
  kind          TravelerKind   @default(ADULT)
  status        TravelerStatus @default(PENDING)
  // Identity (buyer- or companion-filled)
  fullName    String?
  email       String?    // adults only; null for minors
  idDocument  String?    // ID / passport number
  dateOfBirth DateTime?  // minors only
  // Invite token — inline, rotated in place on resend
  inviteTokenHash      String?   @unique   // SHA-256 hex; null once consumed (many NULLs allowed)
  inviteTokenExpiresAt DateTime?
  invitedAt            DateTime?  // last send; reminder-window anchor
  reminderSentAt       DateTime?  // reminder idempotency stamp
  submittedAt          DateTime?  // row completed (buyer or companion)
  consentAt            DateTime?  // required consent checkbox at token submit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tripRequest TripRequest @relation(fields: [tripRequestId], references: [id], onDelete: Cascade)
  @@index([tripRequestId])
  @@index([status])
  @@map("trip_travelers")
}
```
`status`: PENDING (row exists, empty) → INVITED (email sent, awaiting) → COMPLETE (submittedAt set + required fields present). Buyer typing directly or a guardian filling a minor row goes PENDING → COMPLETE with no INVITED. Minor rows never enter INVITED (no email).

### Token module (`src/lib/travelers/travelerInviteTokens.ts`, new)
```ts
const TTL_MS = 7 * 24 * 60 * 60 * 1000;                 // 7 days
function hashToken(plaintext: string): string;          // sha256 hex — copy of tripperInviteTokens

/** Rotate token inline on the row: new hash + expiry + invitedAt, status INVITED. Returns PLAINTEXT. */
export async function issueTravelerInvite(travelerId: string): Promise<string>;

export type TravelerPeek =
  | { ok: true; travelerId: string; tripRequestId: string; kind: TravelerKind; buyerFirstName: string }
  | { ok: false; reason: "invalid" | "expired" | "used" | "locked" };
/** Validate WITHOUT consuming — landing render. Adds "locked" when trip is past cutoff. */
export async function peekTravelerInvite(plaintext: string): Promise<TravelerPeek>;

/** Re-validate (expiry + cutoff), write identity + submittedAt + consentAt, status COMPLETE, null the hash. */
export async function consumeTravelerInvite(
  plaintext: string,
  data: { fullName: string; idDocument: string; email?: string },
): Promise<TravelerPeek>;
```

### Roster module (`src/lib/travelers/travelerRoster.ts`, new — the shared serializer)
```ts
export function computeTravelerCap(paxDetails: unknown): { adultRows: number; minorRows: number };
//   adultRows = max(0, adults - 1)   minorRows = max(0, minors)   defensive: missing ⇒ 0
export function isRosterLocked(trip: { startDate: Date | null; travelersLockedAt: Date | null }): boolean;
//   travelersLockedAt != null  ||  (startDate && now >= startDate - 7d)
export async function ensureRoster(tripId: string): Promise<void>;   // idempotent; only when paid
export function serializeTraveler(row: TripTraveler): TravelerDTO;    // ONE shape
export async function getRosterForTrip(tripId: string): Promise<{
  deadline: string | null; locked: boolean; cap: number; submitted: number; travelers: TravelerDTO[];
}>;
```

### API routes (new)
- `PATCH /api/travelers/[id]` — buyer edit. Guard: `row.tripRequest.userId === session.user.id` **and** `!isRosterLocked`. Body `{ fullName?, email?, idDocument?, dateOfBirth? }`. Flips COMPLETE when required fields present, else stays PENDING (never downgrades a submitted row). Returns updated `TravelerDTO`.
- `POST /api/travelers/[id]/invite` — send/resend. Guard: buyer-owns + not locked + `kind === ADULT` + email present. `issueTravelerInvite` + `sendTravelerInviteEmail`. Returns `TravelerDTO` (status INVITED).
- `POST /api/travelers/submit` — **public**, body `{ token, fullName, idDocument, email?, consent: true }`. Rejects `consent !== true` (400). `consumeTravelerInvite` → on `!ok` `400 { reason }`; on ok fire `TRAVELER_SUBMITTED` notification (+ optional buyer email). Returns `{ ok: true }`.
- Roster READ is **not** a new route — folded into `trip-summary` and `/api/trips/[id]` via `getRosterForTrip`.

### Email (`src/lib/email/index.ts` + `src/emails/`)
```ts
export function sendTravelerInviteEmail(travelerId: string): void;    // fire-and-forget; inviteUrl = `${BASE_URL}/${locale}/invite/${token}`
export function sendTravelerReminderEmail(travelerId: string): void;
```
`src/emails/TravelerInvite.tsx` + `TravelerReminder.tsx` mirror `TripperInvite.tsx`: default component `{ inviteUrl, buyerFirstName, locale }`, inline `{ es, en }` copy object (**NOT** the dictionary — email templates keep their own copy), `EmailLayout`, `export const subjects = { es, en }`. **Copy is gender-neutral** (decision #3): ES uses "su/te invitó a sumarse a su randomtrip"; EN uses "invited you to join their randomtrip" — no "her"/"him". Senders resolve buyer first name + companion email + locale via `resolveLocale`.

### Scheduled job
- `netlify/functions/traveler-reminder.ts` — `config.schedule = "0 * * * *"`, fetches `POST ${siteUrl}/api/internal/traveler-reminder` with `Authorization: Bearer ${CRON_SECRET}` (copy of `destination-reveal.ts`).
- `src/app/api/internal/traveler-reminder/route.ts` — `isAuthorized()` `CRON_SECRET` guard, `runPass1`/`runPass2` exported for testability.
  - **Pass 1**: `TripTraveler` where `status = INVITED`, `reminderSentAt = null`, parent trip `startDate` inside the reminder window (`now .. startDate−7d`) → `sendTravelerReminderEmail` + stamp `reminderSentAt`.
  - **Pass 2**: paid `TripRequest` where `startDate <= now + 7d` and `travelersLockedAt = null` → guarded `updateMany` stamps `travelersLockedAt` (locks roster; idempotent via the null guard).

### UI (`src/components/app/travelers/`, one component per file, no barrel)
- `TravelerRosterSection.tsx` — deadline banner, "X of Y submitted" progress, locked-state banner + support link, maps rows. Shared by success page and dashboard; props `{ roster: TravelerRoster; readOnlyReason?: "locked"; copy; locale }`.
- `TravelerRow.tsx` — single component, `kind` discriminator. Adult: `FormField` name/email/idDocument + `TravelerStatusBadge` + `TableIconButton` send/resend. Minor: name + `DaysInput`/date DOB + idDocument, no email/invite. Inputs disabled when locked.
- `src/components/common/TravelerStatusBadge.tsx` — new, mirrors `ExperienceStatusBadge` (PENDING amber, INVITED sky, COMPLETE green).
- `src/app/[locale]/invite/[token]/page.tsx` — server component, `hasLocale` + `getDictionary` + `peekTravelerInvite` (peek only), passes resolution + `buyerFirstName` to client.
- `src/components/travelers/TravelerInviteClient.tsx` — client form; error / form / submitted branches; required consent checkbox; POSTs `/api/travelers/submit`. Mirrors `TripperInviteClient.tsx`. Destination never rendered.

### Types & i18n
- `src/types/traveler.ts` — `TravelerDTO`, `TravelerRoster`, re-export `TravelerKind`/`TravelerStatus` from `@prisma/client`.
- `src/lib/types/dictionary.ts` — new `InviteTravelersDict` interface + `inviteTravelers` field on `MarketingDictionary`.
- `src/dictionaries/{es,en}.json` — roster section (banner, progress, locked, row labels, buttons, status labels) + landing page copy, both locales.

## File Changes

| File | Action | What |
|---|---|---|
| `prisma/schema.prisma` | Modify | `TripTraveler` model + inline token fields, `TravelerKind`/`TravelerStatus` enums, `TRAVELER_SUBMITTED` notification type, `TripRequest.travelers[]` + `travelersLockedAt`. Apply via `npm run db:push`. |
| `src/lib/travelers/travelerInviteTokens.ts` | Create | `issue`/`peek`/`consume`, forked from `tripperInviteTokens.ts`, rotated inline on the row. |
| `src/lib/travelers/travelerRoster.ts` | Create | `computeTravelerCap`, `isRosterLocked`, `ensureRoster`, `serializeTraveler`, `getRosterForTrip` — the shared serializer. |
| `src/app/api/travelers/[id]/route.ts` | Create | `PATCH` buyer edit; session-owns + cutoff-lock guards. |
| `src/app/api/travelers/[id]/invite/route.ts` | Create | `POST` send/resend invite (adult+email, not locked). |
| `src/app/api/travelers/submit/route.ts` | Create | `POST` public submit-from-token; consent-required; fires buyer notification. |
| `src/app/api/stripe/trip-summary/route.ts` | Modify | Add `paxDetails` + `roster` via `getRosterForTrip`. |
| `src/app/api/trips/[id]/route.ts` | Modify | Add `roster` via `getRosterForTrip` (same shape). |
| `src/emails/TravelerInvite.tsx` | Create | Gender-neutral bilingual template + `subjects`. |
| `src/emails/TravelerReminder.tsx` | Create | Gender-neutral bilingual reminder template + `subjects`. |
| `src/lib/email/index.ts` | Modify | `sendTravelerInviteEmail`, `sendTravelerReminderEmail` (+ optional buyer completion notice). |
| `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx` | Modify | Render `TravelerRosterSection` after the trip-summary card. |
| `src/app/[locale]/(secure)/dashboard/trips/[id]/page.tsx` | Modify | Render `TravelerRosterSection` in the `lg:col-span-2` main column. |
| `src/app/[locale]/invite/[token]/page.tsx` | Create | Server peek → client form landing. |
| `src/components/travelers/TravelerInviteClient.tsx` | Create | Client submit form; consent checkbox; destination hidden. |
| `src/components/app/travelers/TravelerRosterSection.tsx` | Create | Deadline/progress/locked banner + row list; shared. |
| `src/components/app/travelers/TravelerRow.tsx` | Create | Single row, `kind` discriminator; `FormField`/`TableIconButton`. |
| `src/components/common/TravelerStatusBadge.tsx` | Create | Status pill mirroring `ExperienceStatusBadge`. |
| `netlify/functions/traveler-reminder.ts` | Create | Hourly cron → internal route (copy of `destination-reveal.ts`). |
| `src/app/api/internal/traveler-reminder/route.ts` | Create | `CRON_SECRET`-guarded `runPass1`/`runPass2`. |
| `src/types/traveler.ts` | Create | `TravelerDTO`, `TravelerRoster` domain types. |
| `src/lib/types/dictionary.ts` | Modify | `InviteTravelersDict` + `MarketingDictionary.inviteTravelers`. |
| `src/dictionaries/es.json` + `en.json` | Modify | All roster + landing UI copy, both locales. |

## Shared-Serializer Risk (explicit)

`trip-summary` and `/api/trips/[id]` are **two independent endpoints** with two hand-written response shapes today; wiring traveler data into each separately would let the DTOs drift (a field renamed in one, a date serialized differently in the other), silently breaking `TravelerRosterSection` on one surface. Mitigation is structural, not disciplinary: **both routes call the single `getRosterForTrip(tripId)`** and embed its exact return under a `roster` key. `serializeTraveler` is the only place a `TripTraveler` row becomes a DTO. Any future field is added once, in one function, and both surfaces inherit it. No route may build a traveler object inline.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Type | New model/enums wire through; `TravelerPeek`/`TravelerDTO` unions; new dict keys | `npm run typecheck` |
| Lint | No raw `<img>`; design-system badge/button compliance on new UI | `npm run lint` |
| Unit | `issueTravelerInvite` rotates hash inline; `peek` never mutates + returns `locked` past cutoff; `consume` writes fields + rejects expired/used/locked; `computeTravelerCap` defensive on malformed `paxDetails`; `isRosterLocked` at the T-7d boundary; `ensureRoster` idempotent (second call is a no-op) | mock `prisma` (repo vitest pattern) |
| Integration | `getRosterForTrip` returns identical shape from both call sites; write routes reject when locked / not owner; submit rejects without consent | route handler tests |
| Manual | Buyer edits row + sends/resends invite; companion submits with no login + consent; destination never shown on landing; roster locks at cutoff; buyer notified on completion; ≥360px + ≥1280px | QA |

## Migration / Rollout

Merge schema + code, run `npm run db:push` (additive model + enum values + nullable columns — safe, zero-downtime, no backfill). Register the Netlify scheduled function. `CRON_SECRET` already exists (destination-reveal). Rollback: revert commits; dropping `trip_travelers` via `db:push` destroys only in-progress rosters (re-materialized lazily on next paid-trip view). No effect on payments or existing trips.

## Open Questions

- [ ] Reminder-window width for Pass 1 (single send between T-Nd and cutoff) — placeholder assumes one reminder once the trip enters the `now .. startDate−7d` window; confirm exact lead day if a specific cadence is wanted (multi-stage is out of scope).
- [ ] Buyer completion notice: in-app `Notification` is in scope; confirm whether a companion-complete **email** to the buyer is also wanted for v1 (template omitted if not).
