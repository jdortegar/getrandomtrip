# Excuse + refine details for all levels

## Objective

Show the excuse (reason) + refine-details step for every eligible level in `/journey` and add it as step 3 in `/xsed/book`, and persist the selection on `TripRequest` so checkout and admin can show it.

## Problem

- `hasExcuseStep` (`src/lib/constants/product-config.ts`) only enables the step for Explora+ and Bivouac.
- `/xsed/book` has no excuse step at all.
- The excuse and refine details are never persisted: `buildTripRequestPayloadFromSearchParams` (`src/lib/helpers/journey.ts`) drops them, `TripRequest` has no columns, and `checkout/page.tsx` hardcodes `excuse = undefined`, `refineDetails = []`.

## Why

The team never sees why the client is travelling or what they want refined, so the step has no effect today.

## Scope (decided in grill-me, 2026-10-05)

- Levels: Essenza, Modo Explora, Explora+, Bivouac for couple, solo, family, group, paws, plus XSED.
- Out: Atelier and honeymoon.
- Excuses stay per traveler type; same set for every level.
- Excuse required; refine details optional (0..N). Auto-select the excuse when the type has exactly one (family, paws today).
- XSED/book order: 1 Origin → 2 Pax (with travel type) → 3 Excuse (reason + refine details).
- Persist `TripRequest.excuseKey String?` and `TripRequest.refineDetails String[] @default([])`. No backfill.
- Server: pure `sanitizeExcuseSelection({ type, level, status, excuseKey, refineDetails })`:
  - unknown excuse for the type → 400 `INVALID_EXCUSE`
  - missing excuse when `hasExcuseStep` and status is not `DRAFT` → 400 `EXCUSE_REQUIRED`
  - excuse sent where `hasExcuseStep` is false → dropped silently
  - refine keys not in the excuse → filtered silently
- Display: checkout + admin `TripRequestDetails` only.
- Keep the XSED quirk (`TripRequest.level` holds the travel type for XSED); add `travelerTypeOf(trip)` next to `src/lib/db/tripRequestFamily.ts`.
- All new UI copy localized in es + en.

## Constraints

- Delivery: single PR into `develop` (`single-pr`, user choice). Forecast ~850 authored lines.
- No commits without asking the user first (user rule overrides ODD work-unit commits).
- Schema is applied with `prisma db push` (project convention); `.env` points at the stage Neon DB. Apply only with user approval.
- Test runner: `npm test` (vitest). Test-first for pure logic and components with deterministic tests.

## Tasks

- [x] T1 Persistence: schema fields, `travelerTypeOf`, `sanitizeExcuseSelection` + tests, payload builder, `/api/trip-requests` POST/update, checkout reads saved values, admin `TripRequestDetails` row (+ dictionary keys). Route: delegated writer (2+ non-trivial files).
- [x] T2 /journey gate: switch eligible types to `all-levels`, auto-select single excuse, sidebar refine-details completion fix, tests. Route: delegated writer.
- [x] T3 /xsed/book step 3: excuse section with `ExcusesCarousel` / `RefineDetailsCarousel`, payload fields, `XsedSummary` excuse block, localize hardcoded summary copy, tests. Route: delegated writer.
- [x] T4 Apply schema to stage DB (needs approval), run `npm run dev`, manual QA of both flows.

## Acceptance criteria

- Essenza/Modo Explora/Explora+/Bivouac show the excuse step for couple/solo/family/group/paws; Atelier and honeymoon do not.
- Family/paws auto-select their only excuse.
- `/xsed/book` shows step 3 and blocks booking without an excuse.
- Booking saves `excuseKey` + `refineDetails`; checkout and admin show them.
- `npm run typecheck`, `npm run lint`, `npm test` pass.

## Progress

- Branch `feat/excuse-all-levels` created from `origin/develop`.
- T1 implemented (uncommitted): schema fields (`prisma generate` run, no db push), `travelerTypeOf`, `sanitizeExcuseSelection` (RED observed, then GREEN), payload builder, `/api/trip-requests` POST (create, family reuse, owned update), checkout reads saved values, admin `TripRequestDetails` rows. Tests added. Box left unchecked pending review.
- T2 implemented (uncommitted): gate switched to `all-levels` (+ XSED rule `hasExcuseStep(type, "xsed")`), single-excuse auto-select (`useJourneyAutoExcuse`), sidebar refine-details completion fix; refine details now optional in `isSubstepValueComplete` / `isStepComplete` to match the scope decision.
- T3 implemented (uncommitted): `/xsed/book` excuse section, POST fields, `XsedSummary` excuse block and localized copy (es + en), tests.
- Verified: typecheck and lint clean; `npm test` 6023 pass, 7 fail (PDF layout tests in `src/lib/trip-documents/pdf`, unrelated; `initialDates` failure was caused by this change and fixed).
- Parent spot check: typecheck clean; `excuse-selection.test.ts` 8/8 pass.
- T4: user approved; `prisma db push` applied to stage (`ep-weathered-glitter`), in sync. Existing user dev server on :3010 serves the branch; `/journey` and `/xsed/book` return 200. Manual QA pending (user, in browser).
- T3 follow-up (uncommitted): `/xsed/book` now renders the journey `ExcuseStep` (substeps `reason` + `refine-details`, journey copy via `journey.mainContent` / `journey.contentTabs`), Next advances pax -> reason -> refine details, checkout shows after the last substep; XSED-specific `xsedBook.excuse` and its contentTabs entry removed. Typecheck, lint, xsed + journey tests pass.
- Max 3 refine details (uncommitted): `MAX_REFINE_DETAILS` in product-config, pure `toggleRefineDetail` (excuse-helper) used by /journey and /xsed/book, server cap in `sanitizeExcuseSelection`, refine-details copy now says "Optional ... up to 3" (es + en, hardcoded 3, guarded by a test). RED then GREEN; vitest, typecheck, lint clean.
- Engram mirror pending: save failed with a host session registration hook error.
- Family/paws catalog (uncommitted): +2 excuses each (`family-nature-wildlife`, `family-beach-sun`, `paws-beach`, `paws-city`) with es/en overrides, fixed broken images (theme-parks, cultural-learning, paws beach-activities), data test `src/lib/data/shared/__tests__/excuses.test.ts` (RED then GREEN), XSED tests use a mocked single-excuse catalog for the auto-select rule; remaining vitest failures are the unrelated PDF-layout tests.

- Carousel/nesting fixes (uncommitted): `EmblaCarousel` static mode now follows measured container width via `useCarouselCapacity` (3 cards no longer unreachable on phones); `ExcuseCard` CTA is a non-interactive span (no nested button). RED then GREEN.

## Open questions

- Resolved: `getInitialStepFromParams` now falls through to Details when the URL already has an excuse (test: `src/app/[locale]/journey/__tests__/initialStep.test.ts`).
- Resolved: `AdminTripRequest` now declares `excuseKey` and `refineDetails`; intersection workaround removed.
- Release: run `prisma db push` against prod before/with deploy (stage already has the columns).

## Delivery

- Strategy: `single-pr` into `develop` (user choice).
- Commits: `adf5229d` fix(carousel), `e169afde` fix(journey) city selector, `1f41dc3e` fix(journey) excuse card, then the `feat(excuses)` feature commit.
- Verified before commit: full vitest 6073/6077 (4 PDF layout failures identical on `origin/develop`), typecheck and lint clean, mobile 360px checked in Chrome.

## Next step

PR review; on release run `prisma db push` against prod.
