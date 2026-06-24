# Apply Progress: destination-reveal-flow — PR 1 + PR 2

_Last updated: 2026-06-23_

---

## PR 1 Scope: Phases 1–5 (backend only, no UI)

### Phase 1: Foundation — Schema, Types, Dictionary

- [x] 1.1 Add `destinationAssignmentNotifiedAt DateTime?` to `TripRequest` in `prisma/schema.prisma`; add `ADMIN` to `NotificationAudience` enum
- [x] 1.2 Run `npm run db:generate` to regenerate Prisma client (Prisma Client v7.8.0 regenerated successfully)
- [x] 1.3 Add `TripRevealDict` interface to `src/lib/types/dictionary.ts`; add `tripReveal` section + dashboard card labels to dictionaries — completed in PR 2
- [x] 1.4 Schema type-level assertion — covered by vitest test in route test (TripRequest fields used in Prisma queries verified at compile time via typecheck)

### Phase 2: Core Logic — Countdown Helper

- [x] 2.1 Create `src/lib/helpers/getRevealCountdown.ts` — pure functions: `getRevealAt`, `getNotifyAt`, `isInRevealWindow`, `isInNotifyWindow`, `getRevealCountdown`
- [x] 2.2 Tests in `src/lib/helpers/__tests__/getRevealCountdown.test.ts` — 15 tests, all green

### Phase 3: Email Layer

- [x] 3.1 Create `src/emails/DestinationAssignmentReminder.tsx` — admin-facing email template. Props: `adminName`, `clientName`, `tripId`, `startDate`, `locale`. Both es/en copy. `subjects` export.
- [x] 3.2 Add `sendDestinationAssignmentReminder(tripRequestId: string)` to `src/lib/email/index.ts` — queries all ADMIN users, loops sends, fire-and-forget pattern
- [x] 3.3 Modify `src/emails/DestinationRevealed.tsx` — added `tripId: string` prop; updated `ctaHref` to `/${locale}/dashboard/trips/${tripId}/reveal`
- [x] 3.4 Updated `sendDestinationRevealed` in `src/lib/email/index.ts` — passes `tripId: tripRequestId` to `React.createElement(DestinationRevealed, ...)`. Also fixed `scripts/send-test-email.ts` to add required `tripId` prop.

### Phase 4: Cron Route

- [x] 4.1 Create `src/app/api/internal/destination-reveal/route.ts` — `isAuthorized` guard (copied from `xsed/notify/route.ts`); calls `runPass1` then `runPass2`; returns `200 { pass1, pass2, errors }` or `401`/`500`
- [x] 4.2 Implement `runPass1` — queries CONFIRMED trips within T-72h with `destinationAssignmentNotifiedAt IS NULL`; creates Notification per admin (`audience: "ADMIN"`, `type: "BOOKING_CONFIRMED"`); calls `sendDestinationAssignmentReminder`; stamps `destinationAssignmentNotifiedAt`; re-escalation for T-48h with no experience
- [x] 4.3 Implement `runPass2` — queries CONFIRMED trips within T-48h with `experienceId IS NOT NULL`; derives `actualDestination`; guarded `updateMany({ where: { id, status: "CONFIRMED" } })`; calls `sendDestinationRevealed`
- [x] 4.4 Tests in `src/app/api/internal/destination-reveal/__tests__/route.test.ts` — 12 tests, all green

### Phase 5: Netlify Scheduled Function

- [x] 5.1 Create `netlify/functions/destination-reveal.ts` — mirrors `xsed-notify.ts`; schedule `0 * * * *`; target `${siteUrl}/api/internal/destination-reveal`; log prefix `[destination-reveal]`

---

## PR 1 Quality Gate

- [x] `npm run typecheck` — 0 errors
- [x] `npm run test` — 27 tests passing (15 countdown + 12 route)

---

## PR 2 Scope: Phases 1.3, 6–10 (UI + cleanup)

### Phase 1.3 (deferred from PR 1): Dictionary

- [x] Added `TripRevealDict` interface to `src/lib/types/dictionary.ts`
- [x] Added `tripReveal` section (17 keys) to `src/dictionaries/es.json` and `src/dictionaries/en.json`
- [x] Added `revealCountdown` and `revealDestination` keys to `DashboardDict.upcomingTrips` (both locales) — needed by dashboard panels

### Phase 6: API Extension

- [x] 6.1 Modified `src/app/api/trips/[id]/route.ts` — extended `include.experience.select` to add `heroImage`, `destinationCity`, `destinationCountry`
- [x] Tests: `src/app/api/trips/[id]/__tests__/route.test.ts` — 5 tests (401, 404 user, 404 trip, 403 ownership, 200 with new experience fields), all green

### Phase 7: Reveal Page

- [x] 7.1 Created `src/app/[locale]/(secure)/dashboard/trips/[id]/reveal/` directory
- [x] 7.2 Created `reveal/page.tsx` — `dynamic(..., { ssr: false })`; `SecureRoute` wrapper; fetches `GET /api/trips/[id]`; sets notFound on 403/404; branches on status
- [x] 7.3 Pre-reveal: live countdown via `useEffect`+`setInterval(1000)` calling `getRevealCountdown`; pendingAssignment fallback when countdown.revealed=true but status=CONFIRMED; all copy from `dict.tripReveal`. Post-reveal: HeaderHero with heroImage, destination name, "Ver Itinerario" CTA → `/{locale}/dashboard/trips/[id]/details`
- [x] 7.4 Tests: `reveal/__tests__/page.test.ts` — 8 logic tests (pre-reveal state, countdown math, pendingAssignment trigger, destination resolution priority, not-found state); all green. Note: project has no @testing-library/react; render tests replaced with pure logic tests.

### Phase 8: Dashboard Entry Points

- [x] 8.1 Modified `UpcomingTripsPanel.tsx` — added conditional reveal links: Clock icon + `revealCountdown` label for CONFIRMED, Sparkles icon + `revealDestination` label for REVEALED; both use `<Button asChild size="sm" variant="ghost">` + `<Link>` via `pathForLocale`
- [x] 8.2 Modified `AllTripsGrid.tsx` — same conditional reveal links (safety/consistency guard)

### W1 Fix (from PR 1 verify):

- [x] Updated `src/emails/DestinationAssignmentReminder.tsx` — CTA changed from `/${locale}/dashboard` to `/${locale}/dashboard/admin`

### Phase 9: Dead Code Removal

- [x] 9.1 Verified zero references: `rg "reveal-destination" src/` returned only the files being deleted; `rg "api/bookings" src/` returned nothing
- [x] 9.2 Deleted `src/app/[locale]/(secure)/reveal-destination/` (RevealDestinationClient.tsx + page.tsx)
- [x] 9.3 Deleted `src/app/api/bookings/route.ts` and empty `bookings/` directory
- [x] 9.4 Removed `"/reveal-destination"` from `SECURE_PATH_PREFIXES` in `src/lib/helpers/secureClientPaths.ts`

---

## PR 2 Quality Gate

- [x] `npm run typecheck` — 0 errors
- [x] `npm run test` — 171 passing tests; 13 new (5 route + 8 page logic); 6 pre-existing failures (xsed notifications: 2, admin/xsed route: 4) unrelated to this change
- [x] `npm run lint` — command broken in baseline (Next.js 16 removed `next lint` CLI); verified no raw `<img>` tags, no TS errors via typecheck

---

## TDD Cycle Evidence (Strict TDD Mode)

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 6.1 GET /api/trips/[id] extension | Tests written first: 401, 404 user, 404 trip, 403 ownership, 200 with new fields | Route extended with heroImage/destinationCity/destinationCountry; all 5 tests pass | Cast to NextRequest to fix TS error |
| 7.4 Reveal page logic | Tests written: pre-reveal state, countdown math, pendingAssignment trigger, destination resolution, 403 handling | Logic implemented in page.tsx; helper from PR 1 reused | Replaced @testing-library/react (not installed) with pure logic tests |

---

## Notes

- `sendDestinationRevealed` signature unchanged — no callers updated needed
- `DestinationRevealed.tsx` `tripId` prop required from PR 1 forward
- `NotificationAudience.ADMIN` available from PR 1 forward
- `destinationAssignmentNotifiedAt` nullable, no backfill needed
- Lint broken baseline (Next.js 16 removes `next lint`); ESLint 8.57 incompatible with flat config format — pre-existing, not introduced by this PR
- `AllTripsGrid` currently filters COMPLETED trips only — CONFIRMED/REVEALED never appear there, but reveal links added for future-proofing as designed
