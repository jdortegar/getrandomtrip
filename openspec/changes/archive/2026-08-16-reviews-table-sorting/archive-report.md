# Archive Report: Reviews Table Sorting (Tripper + Admin)

**Change Name**: `reviews-table-sorting`  
**Status**: COMPLETE — all tasks shipped and verified  
**Archived**: 2026-08-16  
**Artifact Store Mode**: Hybrid (openspec files + engram mirror)

## Executive Summary

The `reviews-table-sorting` change establishes the first server-side sorting convention in the codebase, enabling both tripper and admin reviews surfaces to filter by configurable sort fields and directions. Tripper page offers rating and created; admin page adds traveler and tripper name. All sorting is validated via per-surface whitelists, composed with existing filter/search, and backed by a shared pure sort module (`src/lib/reviews/sort.ts`). Specification merged into main specs at `openspec/specs/reviews-list-sorting/spec.md`.

## Artifacts Synced

| Artifact | Location | Action |
|----------|----------|--------|
| Reviews List Sorting Spec | `openspec/specs/reviews-list-sorting/spec.md` | Created (new capability, no prior main spec) |
| Delta Spec (retained) | `openspec/changes/reviews-table-sorting/specs/reviews-list-sorting/spec.md` | Kept in change folder as copy-semantics trail |

## Change Contents

### Proposal
- **File**: `openspec/changes/reviews-table-sorting/proposal.md`
- **Scope**: Established first sort convention in codebase; per-surface whitelists; default state reflects actual order (created descending); composition with filter/search.
- **Key Decisions**:
  - Tripper page: `rating`, `created` only (no relation sorts on narrower surface)
  - Admin page: `rating`, `created`, `traveler`, `tripper` (4 fields)
  - Postgres native null placement accepted for tripper-name sort (no custom workaround)
  - Server-side only (Prisma `orderBy`); sort resets page to 1
  - No sort on boolean `status`, free-text `review`, or opaque `tripId` fields

### Design
- **File**: `openspec/changes/reviews-table-sorting/design.md`
- **Scope**: Technical architecture, token vocabulary, shared `sort.ts` module, UI affordances.
- **Key Decisions**:
  - One shared `src/lib/reviews/sort.ts` module (not duplicated whitelists) — precedent already exists in `src/lib/notifications/list-query.ts`
  - Nested relation `orderBy` verified supported; `nulls` key not type-legal on non-nullable `name` scalar
  - `SortButton` presentational primitive (title + arrow icon from lucide-react)
  - Deterministic tiebreakers (`{ id: "asc" }` on all sorts; `{ createdAt: "desc" }` on non-created sorts)
  - State duplicated per client (consistent with prior filter/search change)

### Tasks
- **File**: `openspec/changes/reviews-table-sorting/tasks.md`
- **Status**: All 8 tasks complete and GREEN

#### Slice A — Data Layer (✅ complete)
1. **A1. Pure sort module** [x] — `src/lib/reviews/sort.ts` + `__tests__/sort.test.ts`
   - Types: `REVIEW_SORT_FIELDS`, `TRIPPER_REVIEW_SORT_FIELDS`, `ReviewSortBy`, `TripperReviewSortBy`, `ReviewSortOrder`
   - Constants: `REVIEW_SORT_DEFAULT`, `REVIEW_SORT_INITIAL_ORDER`
   - Parsers: `parseReviewSortBy`, `parseReviewSortOrder` (never-throw)
   - Mapper: `reviewListOrderBy` (4 tokens → exact Prisma `orderBy` array with tiebreakers)
   - Tests: whitelist validation, null-placement assertion, deterministic tiebreaker containment

2. **A2. getTripperReviews extension** [x] — `src/lib/db/tripper-queries.ts` + extended test
   - Added: `sortBy?: TripperReviewSortBy`, `sortOrder?: ReviewSortOrder` to options
   - Replaced: hardcoded `orderBy: { createdAt: "desc" }` (line 874) with `orderBy: reviewListOrderBy(sortBy, sortOrder)`
   - Tests: backward compatibility (no params → created desc), exact ordering, where clause invariance

3. **A3. Admin route** [x] — `src/app/api/admin/reviews/route.ts` + route test
   - Added: `parseReviewSortBy(searchParams.get("sortBy"), ADMIN_REVIEW_SORT_FIELDS)` and `parseReviewSortOrder(...)`
   - Replaced: hardcoded `orderBy: { createdAt: "desc" }` (line 46) with `orderBy: reviewListOrderBy(sortBy, sortOrder)`
   - Tests: unknown sortBy fallback, combined filter/search/sort scenario, where/select/skip/take shape invariance

4. **A4. Tripper reviews route** [x] — `src/app/api/tripper/reviews/route.ts`
   - Added: `parseReviewSortBy` and `parseReviewSortOrder` parsing next to existing status/search blocks
   - Forwards: `sortBy` and `sortOrder` to `getTripperReviews` call

#### Slice B — UI (✅ complete, depends on Slice A)
5. **B1. SortButton primitive** [x] — `src/components/ui/SortButton.tsx`
   - Renders: title + direction-aware arrow (lucide `ArrowUpDown` inactive, `ArrowUp` asc, `ArrowDown` desc)
   - Styling: `h-3.5 w-3.5` icons, inactive arrow visible at `text-neutral-300`, active at `text-light-blue`
   - A11y: `aria-label` and optional `aria-pressed` (tripper page) or `undefined` (admin uses `<th>` `aria-sort`)

6. **B2. Tripper page client** [x] — `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` + new test
   - Added: `sortBy`/`sortOrder` state seeded from `REVIEW_SORT_DEFAULT`
   - Added: `toggleSort` handler (flip direction if same field, else set field + seed from `REVIEW_SORT_INITIAL_ORDER`)
   - Added: header strip above `<ul>` (role="group", aria-label, bg-gray-50, 2 SortButtons for rating/created)
   - Updated: fetch params + effect deps to include `sortBy`/`sortOrder`; setPage(1) on sort change
   - Tests: initial state (created desc, no extra requests), click scenario (field + direction), combined with filter/search/page

7. **B3. Admin page client** [x] — `src/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient.tsx` + new test
   - Added: `sortBy`/`sortOrder` state, `toggleSort` handler (same logic as B2)
   - Updated: 4 sortable `<th>` (traveler, rating, tripper, created) → `SortButton` wrapper, `aria-sort` computed
   - Updated: 4 non-sortable `<th>` (review, status, tripId, actions) unchanged
   - Updated: fetch params + effect deps; setPage(1) on sort change
   - Tests: initial state, exact 4 buttons, click scenario, aria-sort values, combined filter/search/page

8. **B5. Dual-locale copy** [x] — `src/dictionaries/{es,en}.json` + `src/lib/types/dictionary.ts`
   - Added to `TripperReviewsDict`: `sort: { groupLabel, rating, created, ariaSortBy, ariaAscending, ariaDescending }`
   - Added to admin `reviews` dict: `sort: { ariaSortBy, ariaAscending, ariaDescending }` (reuses existing `columns.*` titles)
   - Both dictionaries updated in `es.json` and `en.json` in parallel
   - Typecheck passes — all required keys present

#### Manual QA (not unit-testable, requires real DB)
- **MQ1**: Verified with ≥1 `tripperId: null` ("Randomtrip") row and named-tripper rows; confirmed Randomtrip rows appear **last on asc, first on desc**; confirmed row count and total unchanged

## Spec Alignment

The merged specification (`openspec/specs/reviews-list-sorting/spec.md`) contains:
- **8 core requirements** covering tripper fields, admin fields, null placement, default state, whitelist validation, global ordering, and composition with filters
- **14 scenarios** per requirement (GWT format)
- **6 non-goal statements** (status sort, review/tripId sort, tripper-page relation sorts, client-side sort, no filter changes, no other tables, no multi-column/persistence)

All requirements satisfied by the implemented tasks. No spec divergence.

## Quality Gates

- [x] `npm run typecheck` passes (dual-locale copy + sort module types verified)
- [x] `npm run lint` passes (no raw `<img>`, no accessibility misuse)
- [x] All unit tests GREEN (RED → GREEN on all 8 tasks; mocked Prisma tests cover whitelist, ordering, composition)
- [x] Manual QA complete (Postgres null placement verified)
- [x] No `prisma/schema.prisma` diff (code-only change)
- [x] Backward compatible (both read paths return today's order when no sort params supplied)

## Review Workload Summary

**Files Modified/Created**:
- New: `src/lib/reviews/sort.ts`, `src/lib/reviews/__tests__/sort.test.ts`
- New: `src/components/ui/SortButton.tsx`
- New: `src/components/app/dashboard/tripper/reviews/__tests__/ReviewsPageClient.test.tsx`
- New: `src/app/[locale]/(secure)/dashboard/admin/__tests__/AdminReviewsPageClient.test.tsx`
- Modified: `src/lib/db/tripper-queries.ts` (extended test + logic)
- Modified: `src/app/api/tripper/reviews/route.ts` (param parsing + forwarding)
- Modified: `src/app/api/admin/reviews/route.ts` (param parsing + orderBy replacement)
- Modified: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/lib/types/dictionary.ts`

**Line Estimate**: 330–430 changed/added lines (Medium budget risk per proposal, managed via careful module design and accepted null-placement behavior)

## Rollback Plan

Code-only — no schema change, no migration. A straight `git revert` restores hardcoded `createdAt desc` on both surfaces exactly. Backward compatible on read paths: with no sort params supplied, both endpoints return today's exact order, so reverting only client leaves endpoints safe.

## Closure

**All tasks complete** ✅  
**All tests passing** ✅  
**Spec merged into main** ✅  
**Change ready to move to archive** ✅

The `reviews-table-sorting` change establishes the first sort precedent in the codebase. Future tables (experiences, blog, notifications, etc.) will copy the query-param naming, whitelist pattern, and UI affordance language from these artifacts — making this change a foundation for consistency across the dashboard.

---

**Traceability**  
Engram observations (stored in hybrid mode):
- Proposal: `sdd/reviews-table-sorting/proposal`
- Spec: `sdd/reviews-table-sorting/spec` (observed during design phase)
- Design: `sdd/reviews-table-sorting/design` (observed during design phase)
- Tasks: `sdd/reviews-table-sorting/tasks`
- Archive Report: `sdd/reviews-table-sorting/archive-report` (this document)

Next change: ready for new SDD work or continuation of parallel enhancements.
