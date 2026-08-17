# Tasks: Tripper Profile Visibility

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~950-1150 total (impl + tests), across 6 units; largest single unit ~300-350 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (schema) → PR2 A, PR3 B, PR4 C1 (parallel siblings) → PR5 C2 (parallel) → PR6 C3 (after PR4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — user has not chosen; do not assume |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

**Dependency correction vs. initial 3-slice hypothesis**: design.md's `getAllTrippers` diff (§3) bundles `tripperSlug: { not: null }` and `isActive: true` into the *same* `where` clause, and design.md's Rollout step 1 states schema must land first because "every one of the ~9 `where` additions is a Prisma type error" until `db:push`+`db:generate` run. So Slice A is **not** independent of B — it needs the `isActive` column, not B's endpoint/UI. Fix: extract schema as its own Phase 0 foundation (tiny), then A, B, C1, C2 run as independent siblings, all depending only on Phase 0. C3 (journey flow) additionally depends on C1 for the shared `TripperUnavailableNotice` component.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 0 | Schema: `isActive` column + `db:push`/`db:generate` | PR 1 | Tiny; base=main/tracker; blocks all others, merge first regardless of chain strategy |
| A | Listing filter + slug-synthesis removal | PR 2 | Depends on PR1 only |
| B | Status endpoint + toggle UI + hydration + i18n | PR 3 | Depends on PR1 only |
| C1 | Profile three-way lookup + unavailable notice | PR 4 | Depends on PR1 only |
| C2 | Matching exclusion sweep (8 remaining sites) | PR 5 | Depends on PR1 only |
| C3 | Journey flow (410 + `JourneyPageClient`) | PR 6 | Depends on PR1 + PR4 (reuses `TripperUnavailableNotice`) |

## Phase 0: Schema Foundation (blocks all below)

- [x] 0.1 Add `isActive Boolean @default(true)` to `User` in `prisma/schema.prisma` (after `availableTypes`, ~line 36)
- [x] 0.2 Run `npm run db:push && npm run db:generate`

## Phase 1: Listing Filter + Synthesis Removal (Unit A)

- [x] 1.1 RED: extend `tripper-queries.getAllTrippers.test.ts` — `where` asserts `tripperSlug: { not: null }` + `isActive: true`
- [x] 1.2 GREEN: update `getAllTrippers` where in `tripper-queries.ts:189-213`; add `.filter((t): t is typeof t & { tripperSlug: string } => ...)` narrowing before `.map`
- [x] 1.3 Remove slug synthesis in `TopTrippersGrid.tsx:32-40` (both `href` and `instagramUrl`)
- [x] 1.4 Remove slug synthesis in `TripperSearchModal.tsx:160-162`

*(spec: Listing Completeness Filter, Listing Active Filter)*

## Phase 2: Status Endpoint + Toggle UI + Hydration + i18n (Unit B)

- [x] 2.1 RED: `api/user/tripper/status/__tests__/route.test.ts` — 401 no session, 400 non-boolean, 400 null slug, 200 writes only `isActive` (assert `update` data keys === `["isActive"]`) — added during this followup pass (was missing despite the route already existing)
- [x] 2.2 GREEN: create `api/user/tripper/status/route.ts` per design (session → boolean check → slug guard → update)
- [x] 2.3 Add `isActive: true` to GET `select` in `api/user/tripper/route.ts:20-31`
- [x] 2.4 Add `isActive?: boolean` to `TripperSessionExtras` (`src/types/tripper.ts:90-101`)
- [x] 2.5 Add `isActive` to `normalizeExtras` + `useState` init, settings `page.tsx:33-46,77-88`
- [x] 2.6 Add toggle props + `Switch` row to `TripperSettingsPublicUrlCard.tsx` (between lines 58-60)
- [x] 2.7 Wire `handleToggleVisibility` + pass props at settings `page.tsx:357-365`; gate `canToggleVisibility` on `profile.tripperSlug`, not `formData.tripperSlug` — verified correct (gates on `profile.tripperSlug`)
- [x] 2.8 Component test: `TripperSettingsPublicUrlCard.test.tsx` — disabled+hint vs enabled+reflects `isActive`
- [x] 2.9 Add `visibilityLabel`/`visibilityHintDisabled`/`visibilityError` to `es.json`/`en.json` under `tripperDashboard.settingsProfile.publicUrl`; extend `dictionary.ts:321-329`

*(spec: isActive Field, Self-Service Status Endpoint, Toggle UI Gating, Dual-Locale Copy)*

## Phase 3: Profile Three-Way Lookup + Unavailable Notice (Unit C1)

- [x] 3.1 RED: extend `tripper-queries.getTripperBySlug.test.ts` — 3 variants, rethrow on DB error, Experience query skipped when inactive
- [x] 3.2 GREEN: restructure `getTripperBySlug` (`tripper-queries.ts:23-83`) to `TripperBySlugResult` union (`status`/`ok` naming — corrected from a stale `outcome`/`"active"` naming found mid-merge); add `isActive` to `select`; rethrow on catch for BOTH the User lookup and the Experience query
- [x] 3.3 Create `src/components/tripper/TripperUnavailableNotice.tsx` (no `"use client"`, props-only)
- [x] 3.4 Add `trippers.unavailable.{title,description,ctaLabel}` to `es.json`/`en.json`; extend `dictionary.ts:2009`
- [x] 3.5 Update `generateMetadata` + page body in `trippers/[tripper]/page.tsx:43-45,76-84` to branch on `lookup.status`
- [x] 3.6 Fix `trippers/[tripper]/__tests__/metadata.test.ts` — migrate 4 `mockResolvedValue` calls to union shape
- [x] 3.7 Compile-only adapt `experiences/by-tripper/[tripper]/page.tsx:63,95` (`lookup.status !== "ok"` → `notFound()`) — no behavior/copy change

*(spec: Profile Lookup Three-Way Outcome)*

## Phase 4: Matching Exclusion Sweep (Unit C2)

- [x] 4.1 RED: test `?tripper=` User-lookup in `trip-requests/route.ts` rejects inactive slug — added during this followup pass
- [x] 4.2 GREEN: add `isActive: true` to `route.ts:411-417` where
- [x] 4.3 RED: test `getTripperFeaturedTrips` User-lookup excludes inactive — added during this followup pass (implementation already had the filter, test was missing)
- [x] 4.4 GREEN: add `isActive: true` to `tripper-queries.ts:122-124`
- [x] 4.5 RED: test `getTripperExperiencesByTypeAndLevel` returns empty on missed User lookup (not via `Experience.isActive`)
- [x] 4.6 GREEN: add `user.findFirst({ id, isActive: true })` guard before `tripper-queries.ts:321-329`
- [x] 4.7 RED: test each of 4 `tripper-trips.ts` functions returns empty/false when owner inactive
- [x] 4.8 GREEN: extract `isOwnerActive(tripperId)` helper in `tripper-trips.ts`; guard lines 10-20,45-52,70-79,99-109
- [x] 4.9 RED+GREEN: `GET /api/experiences` — `owner: { isActive: true }` in `route.ts:24-27` where; test added during this followup pass (implementation already had the filter, test was missing)
- [x] 4.10 RED+GREEN: `GET /api/admin/experiences` — `owner: { isActive: true }` only when `?ownerActive=true` (`route.ts:36-50`); `TripRequestModal.tsx` sends `ownerActive: "true"`
- [x] 4.11 RED: test `PATCH /api/admin/trip-requests/[id]` 400s on inactive-owner `experienceId`, no `tripRequest.update` call
- [x] 4.12 GREEN: reorder `[id]/route.ts:93-118` — pre-update `experience.findFirst({ owner: { isActive: true } })` guard, reuse result, 400 on miss

*(spec: Matching Exclusion at Every User Lookup)*

## Phase 5: Journey Flow (Unit C3 — depends on Phase 3)

- [x] 5.1 RED: test `getTripperJourneyContext` tagged union (`not_found`/`inactive`/`ok`) — this and 5.2-5.5 were fully missing before this followup pass, despite a pre-existing RED test file
- [x] 5.2 GREEN: restructure `getTripperJourneyContext` (`tripper-queries.ts`) to tagged union; deliberately does NOT filter `isActive` in the User-lookup `where` (would collapse `not_found`/`inactive` into the same null result) — selects `isActive` and branches after, mirroring `getTripperBySlug`; kept its pre-existing null-catch behavior (returns `not_found` on a genuine DB error, unlike `getTripperBySlug`'s rethrow — this helper backs a still-functional generic journey, not page identity)
- [x] 5.3 Update `journey-context/route.ts` — 404 unknown slug, 410 `{error:"tripper_inactive",name}` inactive, 200 ok; added `__tests__/route.test.ts`
- [x] 5.4 Add `TripperContextState` union + fetch branch to `JourneyPageClient.tsx`
- [x] 5.5 Render `<TripperUnavailableNotice>` when unavailable (after `!dict` guard); reads at `allowedLevelsByType`/`allowedTypes`/`tripperBadge` (x2) now derive from `tripperState.status === "ok" ? tripperState.context : undefined`

*(spec: Journey Flow Unavailable State)*

## Followup Notes (tripper-profile-visibility-followup branch)

This SDD change was merged to `main`/`develop` out-of-process (PR #94, by a separate concurrent tool) before `sdd-apply` ran to completion here. That merge had confirmed deviations from this design (`getTripperBySlug`'s `outcome`/`"active"` naming instead of `status`/`"ok"`, missing `name` on the inactive variant, error-swallowing in the catch block) plus Phase 5 (Journey Flow) entirely unimplemented. This apply pass fixed the deviations already partially corrected by an earlier interrupted continuation attempt, completed Phase 5 from scratch, and closed several RED-test gaps left across Phases 2 and 4 where the implementation existed but its test coverage did not. See the apply-progress engram entry for the full list of file-by-file findings.

### Verify-report fixes (W1/W2/W3)

An independent verify pass (`verify-report.md`) found 0 CRITICAL and 3 WARNING findings, all applied on this branch:

- **W1** — `handleToggleVisibility` in settings `page.tsx` now also calls `setProfile((p) => ({ ...p, isActive: next }))` on a successful PATCH, so `cancelEdit()`'s `...profile` spread can no longer show a stale toggle value.
- **W2** — added `tripperDashboard.settingsProfile.publicUrl.visibilityError` to `es.json`/`en.json`/`dictionary.ts`, and wired both the `!res.ok` and `catch` failure branches of the toggle handler to `toast.error(copy.publicUrl.visibilityError)`.
- **W3** — `getTripperExperiencesByTypeAndLevel` (`tripper-queries.ts`) now uses the same `prisma.user.findFirst({ id, isActive: true })` pre-check pattern as its `tripper-trips.ts` siblings, instead of a nested `owner: { isActive: true }` relation filter on the `Experience` query; `tripper-queries.matching.test.ts` updated to assert against the new mock shape.

> Exceeds the skill's 530-word soft budget. Accepted deliberately, matching the precedent set by spec.md and design.md for this same change: the design enumerates ~9 exact matching sites plus a 4-mock test-file fix and a corrected dependency graph (Slice A depends on schema, not just B/C) — collapsing that detail into vaguer tasks is exactly what caused the original 404 bug this change fixes.
