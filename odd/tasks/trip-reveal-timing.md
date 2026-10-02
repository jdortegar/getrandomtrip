# Trip reveal timing and notifications

## Objective

Reveal each trip at a predictable local time, notify the buyer and joined companions reliably by email and in-app, and make every departure-relative deadline use the trip's departure timezone.

## Problem

- Trip dates are calendar dates stored at UTC midnight (`xsedCanonicalDates` in `src/app/api/trip-requests/route.ts`), and every deadline subtracts hours from that instant. In Argentina everything runs 3h early: a Sat Oct 3 trip revealed Wed Sep 30 21:01 ART (production data, 2026-10-02) instead of Thursday.
- `sendDestinationRevealed` is fire-and-forget after the status flip (`destination-reveal/passes.ts`), so a dropped send is never retried. The first real buyer got no reveal email.
- `BOOKING_REVEALED` exists but is never created; companions get no reveal email or notification.
- `DestinationRevealed` formats dates with `toLocaleDateString` without `timeZone`, showing the previous day west of UTC.

## Why

First real XSED customer (departure 2026-10-03) was revealed early and never notified; she and her companion were emailed manually on 2026-10-02.

## Scope

- [x] **V1** `TripRequest.departureTimeZone` (IANA string). Resolution at booking: origin country ISO code from the booking form → `countryToTimezone()`; else the user's browser timezone sent with the booking (`Intl.DateTimeFormat().resolvedOptions().timeZone`, validated); else `America/Argentina/Buenos_Aires` (logged). One shared resolver; all booking clients send the code and browser tz.
- [x] **V2** Backfill script for existing trips: map the stored `originCountry` name (es/en) → ISO → timezone; Argentina only for unmapped rows. Dry run by default listing unmapped/ambiguous rows; `--apply` writes.
- [x] **V3** `getDepartureAt(trip)` = 00:00 of the start calendar date in `departureTimeZone`. All deadlines use it: roster cutoff (72h XSED / 7d), buyer details reminder, companion reminder (24h before departure). Reveal: `getRevealAt(trip)` = 09:00 departure-local on the calendar day two days before departure; admin assignment reminders and countdown UI follow it.
- [x] **V4** Reveal email reliability: awaitable delivery; `TripRequest.revealNotifiedAt` stamped only when the provider accepts; each hourly run retries REVEALED trips with `revealNotifiedAt` null until departure. Migration/backfill must NOT stamp recently revealed trips as notified (stamp only trips revealed before a safe cutoff; the manually notified first customer is stamped explicitly by the operator, not by code).
- [x] **V5** Recipients and channels: buyer and every joined companion (`TripTraveler.userId` set) get the reveal email in their own locale and a `BOOKING_REVEALED` in-app notification linking to `/dashboard/trips/{id}/reveal`. Per-companion delivery stamp on `TripTraveler`; a companion failure never resends to the buyer. Invited-but-not-joined companions get nothing.
- [x] **V6** Reveal email dates formatted in UTC (calendar dates), with tests.

Also on this branch: `b0314f9f` fix(dashboard): stop showing companion trips as awaiting payment.

## Constraints

- No destination in emails or notifications.
- All user-visible copy in es and en dictionaries (or email-local es/en maps matching existing templates).
- Production backfills and sends only after the owner approves a dry run.
- Commits only with explicit user approval; never push or release without asking.

## Acceptance criteria

- A trip departing Sat Oct 3 from Argentina reveals Thu Oct 1 09:00 ART and its roster locks Wed Sep 30 00:00 ART (72h).
- A failed reveal email is retried next hour; a delivered one is never resent.
- Buyer and joined companions each get exactly one reveal email and one in-app notification.

## Checks

- TDD: strict mode (user global config); runner `npx vitest run <path>`.
- `npx tsc -p tsconfig.json --noEmit`, `npx eslint src --max-warnings 0`, full `npx vitest run` at close.

## Delivery

- Branch `fix/companion-trip-not-unpaid` (worktree), one PR for the trip-reveal flow, work-unit commits. Strategy `ask-on-risk`.

## Decisions

- `departureTimeZone` and both `revealNotifiedAt` columns are nullable (additive migration `prisma/migrations/20261002120000_trip_reveal_timing`). NULL zone reads as Buenos Aires until the V2 backfill is approved and applied.
- No tz dependency added: `localTimeToUtc` (`src/lib/helpers/tripTimeZone.ts`) uses Intl offsets, tested across NY/Madrid DST switches and the spring-forward gap. `@date-fns/tz` exists only transitively.
- Candidate queries widen `startDate` by `ZONE_QUERY_MARGIN_MS` (1 day) and re-filter in memory with the exact helper. The traveler-reminder lock pass became findMany + in-memory filter + `updateMany` by id.
- In-app `BOOKING_REVEALED` rows use a deterministic id with `skipDuplicates`, attempted before the email. If a user deletes it and the email then fails, the retry recreates it.
- A stamp write failing after a provider-accepted send can resend next run; mitigated by the per-recipient Resend idempotency key (24h).
- Migration stamps `revealNotifiedAt` only where `startDate < now - 1 day` (already departed); upcoming revealed trips stay NULL so the cron (re)sends. An already-hand-notified upcoming trip must be stamped by the operator (see the SQL header).
- `isTripEnded` (invite/reminder end-of-trip) still uses the UTC calendar day; out of scope here.

## Progress

| Task | Route | Trigger evidence | Status | Commit | Review |
|------|-------|------------------|--------|--------|--------|
| V1 | delegated direct | writer trigger: 2+ non-trivial files | done (tests green) | none | n/a (not committed) |
| V2 | delegated direct | writer trigger | done (tests green); dry run NOT executed | none | n/a |
| V3 | delegated direct | writer trigger | done (tests green) | none | n/a |
| V4 | delegated direct | writer trigger | done (tests green) | none | n/a |
| V5 | delegated direct | writer trigger | done (tests green) | none | n/a |
| V6 | delegated direct | writer trigger | done (tests green) | none | n/a |

Verification: focused vitest files, `npx tsc -p tsconfig.json --noEmit`, `npx eslint src scripts --max-warnings 0`, full `npx vitest run` (541 files, 5825 tests) all green.

## Next step

Owner reviews the diff, approves commits (work-unit split), the migration SQL application to production before code rollout, and the V2 dry run output before `--apply`.
