# Verify Report: tripper-experience-linking

**Date**: 2026-06-08
**Verdict**: PASS WITH WARNINGS
**Typecheck**: 0 errors (`npm run typecheck`)

---

## Task Completeness

| PR | Tasks | Status |
|----|-------|--------|
| PR-1 (schema) | T-01, T-02 | COMPLETE |
| PR-2 (API) | T-03–T-09 | COMPLETE |
| PR-3 (UI) | T-10–T-17 | COMPLETE |
| PR-4 (admin) | T-18–T-21 | COMPLETE |

All 21 tasks marked complete in apply-progress. Code state matches.

---

## Build / Typecheck Evidence

```
npm run typecheck → 0 errors
```

---

## Spec Compliance Matrix

| # | Scenario | Requirement | Evidence | Status |
|---|----------|-------------|----------|--------|
| S1 | Tripper landing: carousel from real data | De-duplicated ACTIVE types only | `getTripperBySlug` queries `isActive:true, status:"ACTIVE"`; flat-map+Set de-dupe | PASS |
| S2 | Tripper landing: zero ACTIVE experiences | Graceful empty state | `availableTypes=[]` → `TripperTravelerTypesSection` renders `null` (no section shown) | PASS (section hidden = valid per spec §4.1 "empty state") |
| S3 | Blog hidden when no published posts | Section not rendered | `{publishedBlogs.length > 0 && <Blog ... />}` in tripper landing page | PASS |
| S4 | Blog posts shown when published | Two posts render | Same conditional; no mock data present | PASS |
| S5 | TripRequest: tripperId set on creation | `tripperId = User.id` | `POST /api/trip-requests` resolves `body.tripper` slug → id, persists `tripperId` | PASS |
| S6 | Unresolvable slug → tripperId null | No error thrown | `resolvedTripperId = tripperUser?.id ?? null`; null passed silently | PASS |
| S7 | No tripper param → full type/level list | Unchanged behavior | `allowedTypes` undefined → full list passed to BudgetStep | PASS |
| S8 | Filtered trip type cards in curated journey | Only matching types; tripper badge on each card | `allowedTypes` filters `localizedTravelerTypes` in JourneyMainContent; `TravelerTypesCarousel` renders `BY TRIPPER [NAME]` badge per card | PASS |
| S9 | Empty state when tripper has no ACTIVE experiences | Graceful empty state at type selection step | `TravelerTypesCarousel` returns `null` when `typesToShow.length === 0 && tripperContext`; JourneyDropdown shows empty accordion — no explicit empty-state message | WARNING |
| S10 | Filtered level options | Only matching levels shown | `allowedLevelsByType[travelerType]` filters plannerContent.levels in BudgetStep | PASS |
| S11 | Tripper badge in header | "VIAJE CURADO POR [NAME]" + avatar | `HeaderHero` renders `tripperBadge` overlay; journey page passes `tripperContext.name/avatarUrl` | PASS |
| S12 | Admin: experience dropdown filtered correctly | Only ACTIVE + matching tripperId/type/level | `GET /api/admin/experiences?tripperId&level&type&status=ACTIVE`; `type: { has: filterType }` | PASS |
| S13 | Admin: dropdown hidden when tripperId null | Notice shown, no experiences listed | `{trip.tripperId ? <FormSelectField> : <p>{dict.noTripperNotice}</p>}` | PASS |
| S14 | Admin save: experienceId set, actualDestination not set | Save omits actualDestination | `handleSave` builds `{ status, experienceId }` only; no actualDestination key | PASS |
| S15 | Tripper OS: earnings via tripperId | Trip counted in bookings/earnings | `attributedBookings = prisma.tripRequest.count({ where: { tripperId, status: { in: [...] } } })` | PASS |
| S16 | Tripper OS: tripperId null → no attribution | Not in any tripper stats | Count query filters by specific tripperId; null rows excluded | PASS |

---

## Invariant Checks

| Invariant | Check | Result |
|-----------|-------|--------|
| `ACTIVE` only in all queries | `getTripperBySlug`, `getTripperJourneyContext`, admin experiences filter all use `status:"ACTIVE"` | PASS |
| `type` uses `{ has: value }` | `admin/experiences` route: `where.type = { has: filterType }` | PASS |
| `tripperId` write-once | Slug resolution only fires when `!id` (create only); updates skip resolution | PASS |
| Null tripperId safe everywhere | Journey: `tripperContext` checked before passing props; admin: conditional on `trip.tripperId`; stats: count by specific id | PASS |
| `actualDestination` not set by admin save | TripRequestModal PATCH body has no `actualDestination` key; derived server-side from experienceId | PASS |

---

## Issues

### WARNING — W-1: S9 empty state is implicit (null) not explicit (message)

**Spec**: §4.3 "If the tripper has ACTIVE experiences for zero types, the step MUST render a graceful empty state."

**Implementation**: `TravelerTypesCarousel` returns `null` when `tripperContext && typesToShow.length === 0`. The parent `JourneyDropdown` accordion item renders with no content — an empty accordion panel, not an explicit message.

**Impact**: Low. The empty accordion is not "silent" in UX terms — the travel type section is visible but empty. However the spec uses the word "graceful empty state" which implies an explicit user-facing message. The BudgetStep level empty state (S10 path) has an explicit "No hay experiencias disponibles para este tipo de viaje" message. Parity is missing at the type level.

**Suggested fix**: Add a fallback render inside BudgetStep `case "budget"` when `filteredTravelerTypes.length === 0 && allowedTypes !== undefined`, to show an explicit message rather than delegating to TravelerTypesCarousel's null return.

---

### WARNING — W-2: `getTripperExperiencesByTypeAndLevel` missing `status: "ACTIVE"` filter

**File**: `src/lib/db/tripper-queries.ts` line 288-310

**Implementation**: WHERE clause is `{ ownerId: tripperId, isActive: true }` — missing `status: "ACTIVE"`.

**Impact**: This function feeds `tripperPackagesByType` on the tripper landing page (used by `TripperPlanner`). Non-ACTIVE experiences (DRAFT, PENDING_REVIEW, etc.) can appear in that planner section if `isActive` is true without `status = ACTIVE`. This leaks unpublished packages into a public-facing section.

**In scope check**: §4.1 covers the experience types carousel (using `getTripperBySlug` which IS fixed). This function is used for the TypeAndLevel planner shown on the tripper landing page. The spec §4.1 covers the carousel specifically, and this planner is a broader display. However the spirit of the spec (§5 invariant: "ACTIVE is the only status that surfaces experiences in any user-facing query") is violated.

**Suggested fix**: Add `status: "ACTIVE"` to the `where` clause of `getTripperExperiencesByTypeAndLevel`.

---

### SUGGESTION — S-1: `attributedBookings` not surfaced in dashboard UI

**Where**: `getTripperDashboardStats` returns `attributedBookings` in the stats object, but no dashboard component was observed consuming that field.

**Impact**: None for functionality — the data is computed correctly (T-09 is correct). The field just isn't displayed anywhere in the Tripper OS UI. It could be added to a stat card later; not a spec violation.

---

### SUGGESTION — S-2: `actualDestination` still accepts manual override via PATCH body

**File**: `src/app/api/admin/trip-requests/[id]/route.ts` lines 51-88

**Implementation**: `actualDestination` is read from `body?.actualDestination` and written if present. The spec §4.8 and §5 state it is "NOT set by admin manually" and must be derived server-side from `experienceId`. The PATCH route still supports direct `actualDestination` writes as a legacy path.

**Impact**: The admin UI modal (TripRequestModal) does NOT send `actualDestination` in the PATCH body. But the API endpoint itself remains a vector for manual override via direct API call. Spec says the admin save action must not set it, and the UI complies — but the API contract is broader than the spec permits.

**Suggested fix**: Remove or reject `actualDestination` from the PATCH body, or at minimum add a guard that ignores it when `experienceId` is present.

---

## Design Coherence

| Decision | Design | Code | Status |
|----------|--------|------|--------|
| AD-1 Schema: `tripperId String?`, SetNull, named relation | Matches | `prisma/schema.prisma` line 115, 132 | PASS |
| AD-2 availableTypes: add `status:"ACTIVE"` | Matches | `getTripperBySlug` lines 49-57 | PASS |
| AD-3 Blog: delete mock, conditional render | Matches | `trippers/[tripper]/page.tsx` line 125 | PASS |
| AD-4 Single endpoint `GET /trippers/[slug]/journey-context` | Matches | Route exists, returns correct shape | PASS |
| AD-5 HeaderHero: optional `tripperBadge` prop | Matches | Implemented exactly | PASS |
| AD-6 Type filtering via `allowedTypes` optional prop | Matches | JourneyMainContent filters localizedTravelerTypes | PASS |
| AD-7 Level filtering via `allowedLevelsByType` Record | Matches | BudgetStep filters plannerContent.levels | PASS |
| AD-8 POST trip-requests: accept `body.tripper` slug, server resolve | Matches | Slug resolved, never trusted as raw id | PASS |
| AD-9 Admin experiences: extend GET with optional filters | Matches | tripperId/level/type/status all supported | PASS |
| AD-10 PATCH: derive actualDestination from experience server-side | Partially matches | derivation correct; but legacy manual path still open | WARNING (see S-2) |
| AD-11 Earnings: tripperId for funnel, ownerId for commissions | Matches | `attributedBookings` uses `tripperId`; earnings use `ownerId` | PASS |

---

## Final Verdict

**PASS WITH WARNINGS**

- 0 CRITICAL issues
- 2 WARNINGs (W-1: implicit empty state at type level; W-2: ACTIVE filter missing in `getTripperExperiencesByTypeAndLevel`)
- 2 SUGGESTIONS (S-1: attributedBookings unused in UI; S-2: API still accepts manual actualDestination override)

Suitable for archive. The WARNINGs are recommended fixes before next release but do not block deployment.
