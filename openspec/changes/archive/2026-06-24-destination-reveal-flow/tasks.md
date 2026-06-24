# Tasks: Destination Reveal Flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 550–700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 (see work units below) |
| Delivery strategy | single-pr |
| Chain strategy | size:exception (single-pr agreed) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size:exception
400-line budget risk: High

> **Note**: Delivery strategy is `single-pr`. This change exceeds the 400-line budget. A `size:exception` sign-off is required before `sdd-apply` starts.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + types + email layer + cron route | PR 1 | Foundation; no UI; independently deployable |
| 2 | Reveal page + dashboard entry points + dead code removal | PR 2 | Depends on PR 1 (experience select + email types) |

---

## Phase 1: Foundation — Schema, Types, Dictionary

- [ ] 1.1 Add `destinationAssignmentNotifiedAt DateTime?` to `TripRequest` in `prisma/schema.prisma`; add `ADMIN` to `NotificationAudience` enum
- [ ] 1.2 Run `npm run db:generate` to regenerate Prisma client
- [ ] 1.3 Add `TripRevealDict` interface to `src/lib/types/dictionary.ts`; add `tripReveal` section + dashboard card labels (`revealCountdown`, `revealDestination`) to `src/dictionaries/es.json` and `src/dictionaries/en.json`
- [ ] 1.4 **TEST (RED→GREEN)**: write vitest unit test for schema field presence — assert `destinationAssignmentNotifiedAt` is nullable on a mock `TripRequest` object (type-level test via `satisfies`)

---

## Phase 2: Core Logic — Countdown Helper

- [ ] 2.1 Create `src/lib/helpers/getRevealCountdown.ts` — pure function `getRevealCountdown(startDate: Date, now: Date): { revealed: boolean; days: number; hours: number; minutes: number; seconds: number }`
- [ ] 2.2 **TEST (RED→GREEN)**: write `src/lib/helpers/getRevealCountdown.test.ts` covering: (a) future reveal → `revealed: false` with correct days/hours; (b) past reveal time → `revealed: true`; (c) exactly 48h before → boundary; (d) UTC timezone correctness with fixed-clock inputs

---

## Phase 3: Email Layer

- [ ] 3.1 Create `src/emails/DestinationAssignmentReminder.tsx` — React Email template mirroring `AdminNewBooking.tsx`; props: `tripId`, `clientName`, `startDate`, `originCity`, `tripType`, `ctaHref`, `locale`; `subjects = { es, en }` export
- [ ] 3.2 Add `sendDestinationAssignmentReminder(tripId: string)` to `src/lib/email/index.ts` — queries all ADMIN users, loops sends, fire-and-forget pattern
- [ ] 3.3 Modify `src/emails/DestinationRevealed.tsx` — add `tripId: string` prop; update `ctaHref` to `${BASE_URL}/${locale}/dashboard/trips/${tripId}/reveal`
- [ ] 3.4 Update `sendDestinationRevealed` in `src/lib/email/index.ts` — pass `tripId` as the new prop in `React.createElement(DestinationRevealed, { ...tripId })`; no signature change to the public function

---

## Phase 4: Cron Route — `POST /api/internal/destination-reveal`

- [ ] 4.1 Create `src/app/api/internal/destination-reveal/route.ts` — `isAuthorized` guard (copy from `xsed/notify/route.ts`); call `runPass1` then `runPass2` inside try/catch; return `200 { pass1, pass2, errors }` or `401` / `500`
- [ ] 4.2 Implement `runPass1` inside the route module — query CONFIRMED trips within T-72h with `destinationAssignmentNotifiedAt IS NULL`; for each: create one `Notification` per admin (`audience: "ADMIN"`, `type: "BOOKING_CONFIRMED"`); call `sendDestinationAssignmentReminder`; stamp `destinationAssignmentNotifiedAt = now`; handle re-escalation for trips also within T-48h AND `experienceId IS NULL`
- [ ] 4.3 Implement `runPass2` inside the route module — query CONFIRMED trips within T-48h with `experienceId IS NOT NULL`; for each: `findUnique` the experience for city/country; guarded `update({ where: { id, status: "CONFIRMED" }, data: { status: "REVEALED", destinationRevealedAt, actualDestination } })`; call `sendDestinationRevealed`
- [ ] 4.4 **TEST (RED→GREEN)**: write `src/app/api/internal/destination-reveal/route.test.ts` — mock Prisma + email; test: (a) 401 on bad secret; (b) Pass 1 stamps and notifies; (c) Pass 1 idempotency (already-stamped trip skipped); (d) Pass 2 reveals and sends email; (e) Pass 2 skips trips without `experienceId`; (f) already-REVEALED trip skipped; (g) per-row error is accumulated, not thrown

---

## Phase 5: Netlify Scheduled Function

- [ ] 5.1 Create `netlify/functions/destination-reveal.ts` — byte-for-byte mirror of `xsed-notify.ts`; set `schedule: "0 * * * *"`; target URL `${siteUrl}/api/internal/destination-reveal`; log prefix `[destination-reveal]`

---

## Phase 6: API Extension — GET `/api/trips/[id]`

- [ ] 6.1 Modify `src/app/api/trips/[id]/route.ts` — extend `include.experience.select` to add `heroImage: true`, `destinationCity: true`, `destinationCountry: true`

---

## Phase 7: Reveal Page

- [ ] 7.1 Create route directory `src/app/[locale]/(secure)/dashboard/trips/[id]/reveal/`
- [ ] 7.2 Create `reveal/page.tsx` — `dynamic(..., { ssr: false })`; `SecureRoute` wrapper; fetch `GET /api/trips/[id]`; ownership redirect (404 on 403); branch on `trip.status`: pre-reveal (`CONFIRMED`) renders countdown, post-reveal (`REVEALED | COMPLETED`) renders `HeaderHero` + destination + "Ver Itinerario" CTA → `/{locale}/dashboard/trips/[id]/details`
- [ ] 7.3 Inline countdown UI in the page — `useEffect` + `setInterval(1000)` calling `getRevealCountdown`; "destino en preparación" fallback when `revealAt` is past but status still `CONFIRMED`; all copy from `dict.tripReveal`
- [ ] 7.4 **TEST (RED→GREEN)**: logic tests for reveal-state discriminator, destination resolution, and ownership enforcement (project has no @testing-library/react; 8 tests, all green)

---

## Phase 8: Dashboard Entry Points

- [ ] 8.1 Modify `src/components/app/dashboard/UpcomingTripsPanel.tsx` — add conditional reveal link for `CONFIRMED` (label from `dict.revealCountdown`, icon `Clock`) and `REVEALED` (label from `dict.revealDestination`, icon `Sparkles`) statuses; use `<Button asChild size="sm" variant="ghost">` + `<Link>`
- [ ] 8.2 Modify `src/components/app/dashboard/AllTripsGrid.tsx` — same conditional reveal link (safety/consistency; CONFIRMED/REVEALED trips don't currently render here but it guards future filter changes)

---

## Phase 9: Cleanup — Dead Code Removal

- [ ] 9.1 Verify zero references: run `rg -F "reveal-destination"` and `rg -F "api/bookings"` across `src/`; fix any remaining callers before deleting
- [ ] 9.2 Delete `src/app/[locale]/(secure)/reveal-destination/` (entire directory)
- [ ] 9.3 Delete `src/app/api/bookings/route.ts` (and `bookings/` dir if empty)
- [ ] 9.4 Remove `"/reveal-destination"` from `SECURE_PATH_PREFIXES` in `src/lib/helpers/secureClientPaths.ts`

---

## Phase 10: Quality Gate

- [ ] 10.1 Run `npm run typecheck` — 0 errors
- [ ] 10.2 Run `npm run lint` — pre-existing environment issue (next lint command missing in Next.js 16); verified no raw `<img>` tags manually; no TS errors confirmed by typecheck
- [ ] 10.3 Run vitest — 171 passing (13 new tests from PR 2: 5 route + 8 page logic); 6 pre-existing failures unrelated to this PR
- [ ] 10.4 Manual QA: (a) navigate to reveal page as CONFIRMED trip owner — countdown visible; (b) navigate as REVEALED trip owner — hero + destination + CTA visible; (c) navigate as non-owner — 404/redirect; (d) dashboard card CONFIRMED shows Clock → reveal link; (e) dashboard card REVEALED shows Sparkles → reveal link
