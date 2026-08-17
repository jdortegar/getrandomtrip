# Tasks: Reviews Table Sorting (Tripper + Admin)

Source artifacts (all reconciled, no divergence): `proposal.md`, `specs/reviews-list-sorting/spec.md`, `design.md` — read in full, cross-checked against Engram `sdd/reviews-table-sorting/{proposal,spec,design}` (obs #394 spec, #395 design). Both spec and design carry the 2026-08-07 correction: Postgres' native null placement is accepted behavior; the `src/lib/db/review-sort-query.ts` workaround module and its test file are **not built** — do not resurrect them in apply.

Strict TDD is active (vitest + happy-dom, `npm run test`). Every task below that touches `src/lib/reviews/sort.ts`, `getTripperReviews`, or a client component follows RED → GREEN → (refactor if needed), not code-first.

## Slice A — Data Layer (no dependency on B)

### A1. Pure sort module — RED then GREEN [x]
- **Satisfies**: Requirement: Server-Side Whitelisted Sort Validation; Requirement: Null Placement for Tripper-Name Sort; Requirement: Sort Is Globally Ordered, Not Page-Scoped (tiebreaker half)
- **Files**: `src/lib/reviews/sort.ts` (new), `src/lib/reviews/__tests__/sort.test.ts` (new)
- **RED first** — write failing tests for `reviewListOrderBy`, `parseReviewSortBy`, `parseReviewSortOrder` per design's Interfaces/Contracts and Testing Strategy tables:
  - Each of the 4 tokens (`rating`, `created`, `traveler`, `tripper`) → exact `orderBy` array, including `{ user: { name } }` / `{ tripper: { name } }` nesting
  - **Regression guard (compensates for the deleted null-workaround module)**: the `tripper` case's emitted `orderBy` array carries **no** `nulls` key anywhere and the query has **no** `tripperId` filter — a future "helpful fix" that adds `tripperId: { not: null }` must fail this test
  - Invalid `sortBy` (e.g. `isApproved`) falls back to `created` while a **valid** `sortOrder` is still honored — assert `parseReviewSortBy("isApproved", ADMIN_REVIEW_SORT_FIELDS) === "created"` and the resulting full `orderBy` is `[{ createdAt: "asc" }, { id: "asc" }]` when `sortOrder=asc`
  - Malformed `sortOrder` (not `asc`/`desc`) → `parseReviewSortOrder` returns `"desc"`
  - Whitelist containment: no emitted key in any `orderBy` array falls outside `{rating, createdAt, user, tripper, id}` — this is a structural assertion over all 4 tokens, not per-token, so a future edit widening the whitelist trips it
  - Every result array ends with `{ id: "asc" }`; non-`created` results also carry `{ createdAt: "desc" }` immediately before it (pagination-stability tiebreaker, spec: Requirement: Sort Is Globally Ordered)
  - `TRIPPER_REVIEW_SORT_FIELDS` rejects `traveler`/`tripper` (tripper-page whitelist is `{rating, created}` only, per spec's tripper-page non-goal scenario)
- **GREEN**: implement `REVIEW_SORT_FIELDS`, `TRIPPER_REVIEW_SORT_FIELDS`, `ADMIN_REVIEW_SORT_FIELDS`, `ReviewSortBy`/`TripperReviewSortBy`/`ReviewSortOrder` types, `REVIEW_SORT_DEFAULT`, `REVIEW_SORT_INITIAL_ORDER`, `parseReviewSortBy`, `parseReviewSortOrder`, `reviewListOrderBy` exactly per design's code block. Import `Prisma` type-only so client components can later import this file.
- **Parallel-safe with**: nothing in Slice A (this is the foundation every other A task imports); can start immediately.

### A2. `getTripperReviews` — extend additively — RED then GREEN [x]
- **Satisfies**: Requirement: Tripper Page Sortable Fields; Requirement: Sort Is Globally Ordered, Not Page-Scoped; Requirement: Server-Side Whitelisted Sort Validation (tripper path)
- **Files**: `src/lib/db/tripper-queries.ts` (modify, `getTripperReviews` at :846-902, `orderBy` at :874), `src/lib/db/__tests__/tripper-queries.getTripperReviews.test.ts` (extend existing)
- **Depends on**: A1 (imports `reviewListOrderBy`, `REVIEW_SORT_DEFAULT`)
- **RED first** — extend the existing mocked-Prisma test file:
  - Omitted `sortBy`/`sortOrder` → `orderBy[0] === { createdAt: "desc" }` (backward compat with today's behavior + honest default)
  - `{ sortBy: "rating", sortOrder: "asc" }` → `orderBy[0] === { rating: "asc" }`
  - `where` is byte-identical with and without sort params present (sorting must never narrow the result set — guards against a copy-paste that accidentally moves a sort token into `where`)
- **GREEN**: add `sortBy?: TripperReviewSortBy` / `sortOrder?: ReviewSortOrder` to the options type, destructure with defaults from `REVIEW_SORT_DEFAULT`, replace the hardcoded `orderBy: { createdAt: "desc" }` at :874 with `orderBy: reviewListOrderBy(sortBy, sortOrder)`. `count` query and `where` block untouched.
- **Parallel-safe with**: A3 (different files, both depend only on A1).

### A3. Admin route — extend additively — RED then GREEN [x]
- **Satisfies**: Requirement: Admin Page Sortable Fields; Requirement: Null Placement for Tripper-Name Sort; Requirement: Server-Side Whitelisted Sort Validation (admin path); Requirement: Sort Composes With Filter, Search, and Pagination
- **Files**: `src/app/api/admin/reviews/route.ts` (modify, `orderBy` at :46), a new route-level test file if one does not already exist for this route (check for `src/app/api/admin/reviews/__tests__/route.test.ts`; if absent, create it following the mocked-Prisma precedent from `tripper-queries.getTripperReviews.test.ts`)
- **Depends on**: A1 (imports `reviewListOrderBy`, `parseReviewSortBy`, `parseReviewSortOrder`, `ADMIN_REVIEW_SORT_FIELDS`)
- **RED first**:
  - Unknown `sortBy` (e.g. `isApproved`) → falls back to default order, does not throw, does not reach `orderBy` raw
  - Combined scenario (spec: Sort, filter, and search apply simultaneously) — `status=unapproved` + `search=<term>` + `sortBy=rating&sortOrder=asc` all present in the constructed `where`/`orderBy` at once; none of the three is dropped
  - `where`/`select`/`skip`/`take`/`count` and the `rawReviews.map` → `tripperName` mapping (route.ts:74-78) remain unchanged in shape — this route test should assert those are still called with the same shape as before, not just that sort works in isolation
- **GREEN**: parse `sortBy`/`sortOrder` next to the existing `rawStatus` block using `parseReviewSortBy(searchParams.get("sortBy"), ADMIN_REVIEW_SORT_FIELDS)` and `parseReviewSortOrder(...)`, replace the hardcoded `orderBy: { createdAt: "desc" }` at :46 with `orderBy: reviewListOrderBy(sortBy, sortOrder)`. Everything else in the route body is byte-identical.
- **Parallel-safe with**: A2 (different files, both depend only on A1).

### A4. Tripper reviews route — forward sort params [x]
- **Satisfies**: Requirement: Tripper Page Sortable Fields (param plumbing); Requirement: Sort Composes With Filter, Search, and Pagination
- **Files**: `src/app/api/tripper/reviews/route.ts` (modify)
- **Depends on**: A1, A2 (needs `TRIPPER_REVIEW_SORT_FIELDS` and the extended `getTripperReviews` signature)
- No new RED here beyond what A2's test already covers at the query layer — this task is route-level plumbing (parse `sortBy`/`sortOrder` next to the existing `rawStatus`/`search` parsing at :44-49, pass through to `getTripperReviews`). If a route-level test file exists for this endpoint, extend it with one assertion that `getTripperReviews` receives the parsed `sortBy`/`sortOrder`; otherwise this is covered transitively by A2 + the client tests in B.
- **Parallel-safe with**: nothing — must land after A1+A2 (sequential tail of Slice A).

**Slice A exit criteria**: `sort.test.ts`, extended `tripper-queries.getTripperReviews.test.ts`, and the admin route test all GREEN. `npm run typecheck` passes. No `prisma/schema.prisma` diff. Both endpoints still return today's exact order when no sort params are supplied (regression check).

## Slice B — UI (depends on Slice A's query-param contract existing; A1–A4 must be merged/present before B starts)

### B1. Shared `SortButton` primitive [x]
- **Satisfies**: Proposal risk "header strip drifts visually from the admin table" (mitigation: one shared component); Requirement: Default Sort State Reflects Actual Order (visual active/inactive states)
- **Files**: `src/components/ui/SortButton.tsx` (new)
- **Depends on**: none from Slice A directly (pure presentational), but logically part of B — do not start before A1 lands since its consumers (B2, B3) need the token types
- No dedicated unit test file for this primitive alone — it is exercised through B2/B3's client tests (per design's Testing Strategy table, which tests behavior through the two page clients, not the button in isolation). Implement per design's exact JSX/class contract: `ArrowUpDown` inactive / `ArrowUp` asc / `ArrowDown` desc from `lucide-react`, `h-3.5 w-3.5`, inactive arrow visible at `text-neutral-300` (never opacity-hidden — design-system rule), active arrow `text-light-blue`, button text `text-[11px] font-semibold uppercase tracking-wider`, `aria-pressed` prop optional (tripper strip only; admin passes `undefined` and relies on the wrapping `<th>`'s `aria-sort`).
- **Parallel-safe with**: nothing meaningful to parallelize against inside B1 itself, but B2 and B3 cannot start their JSX work until this file exists (both import it).

### B2. Tripper page — sort strip, state, fetch params — RED then GREEN [x]
- **Satisfies**: Requirement: Tripper Page Sortable Fields; Requirement: Default Sort State Reflects Actual Order; Requirement: Sort Composes With Filter, Search, and Pagination
- **Files**: `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` (modify), `src/components/app/dashboard/tripper/reviews/__tests__/ReviewsPageClient.test.tsx` (new — no existing test file for this component; follow the `RoleNotificationsPageClient.test.tsx` precedent at `src/components/app/dashboard/shared/__tests__/`)
- **Depends on**: A1 (imports `REVIEW_SORT_DEFAULT`, `REVIEW_SORT_INITIAL_ORDER`, `TRIPPER_REVIEW_SORT_FIELDS`), B1 (`SortButton`)
- **RED first**:
  - First fetch URL contains `sortBy=created&sortOrder=desc` with **zero** extra requests, and the "Created" button renders in its active-descending visual state on initial render (no round trip needed — state seeds from `REVIEW_SORT_DEFAULT`)
  - Clicking "Rating" → next fetch URL has `sortBy=rating&sortOrder=desc&page=1` (first-click direction per `REVIEW_SORT_INITIAL_ORDER.rating === "desc"`); clicking it again → `sortOrder=asc`
  - Combined: with `status=approved` and `search=Ana` active and `page` at 3, clicking a sort control resets to `page=1` while `status` and `search` remain in the fetch URL (spec: Sort, filter, and search apply simultaneously; Changing sort resets to page 1)
  - No sort control renders for `status`/`isApproved`, traveler name, or tripper name on this page (spec non-goal scenarios) — assert absence, not just presence of the two that exist
- **GREEN**: add `sortBy`/`sortOrder` `useState` seeded from `REVIEW_SORT_DEFAULT`, a `toggleSort` handler per design's exact logic (flip direction if same field, else set field + seed from `REVIEW_SORT_INITIAL_ORDER[field]`, always `setPage(1)`), add both params to the fetch `URLSearchParams` and the effect's dependency array, insert the header strip (`role="group"`, `aria-label={copy.sort.groupLabel}`, `bg-gray-50 border-b border-gray-200 px-5 py-3`) between the existing `<h3>` panel header and the `<ul>`, with two `SortButton`s (rating, created) wired to `toggleSort`.
- **Parallel-safe with**: B3 (different files, both depend on A1 + B1 only).

### B3. Admin page — sortable `<th>`, state, fetch params — RED then GREEN [x]
- **Satisfies**: Requirement: Admin Page Sortable Fields; Requirement: Null Placement for Tripper-Name Sort (client-rendered consequence); Requirement: Default Sort State Reflects Actual Order; Requirement: Sort Composes With Filter, Search, and Pagination
- **Files**: `src/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient.tsx` (modify), a new test file colocated per the app's convention for this component (check for an existing `__tests__/` dir alongside this file; if none, create `src/app/[locale]/(secure)/dashboard/admin/__tests__/AdminReviewsPageClient.test.tsx` following the `RoleNotificationsPageClient.test.tsx` precedent)
- **Depends on**: A1 (imports `REVIEW_SORT_DEFAULT`, `REVIEW_SORT_INITIAL_ORDER`, `ADMIN_REVIEW_SORT_FIELDS`), B1 (`SortButton`)
- **RED first**:
  - First fetch URL contains `sortBy=created&sortOrder=desc`, "Created" `<th>` has `aria-sort="descending"` on initial render, zero extra requests
  - Exactly 4 buttons render inside `<thead>` (traveler, rating, tripper, created) — the other 4 `<th>` (review, status, tripId, actions) have no button and no `aria-sort` attribute at all (spec non-goal scenarios: review content and tripId are not sortable)
  - Clicking "Tripper" → fetch URL `sortBy=tripper&sortOrder=asc` (first-click direction per `REVIEW_SORT_INITIAL_ORDER.tripper === "asc"`); clicking again → `desc`
  - `aria-sort` is `"none"` on inactive sortable headers, absent (no attribute) on the 4 non-sortable ones
  - Combined: `status=unapproved` + `search=<term>` + `page=3`, clicking any sort header → `page=1` while status/search persist in the URL
- **GREEN**: add `sortBy`/`sortOrder` `useState` seeded from `REVIEW_SORT_DEFAULT`, `toggleSort` handler (same shape as B2's), add both params to `fetchReviews`'s `URLSearchParams` and the effect's dependency array, on the 4 sortable `<th>` drop existing text classes (kept only by `SortButton`) down to `px-5 py-3 text-left` + `aria-sort` computed from `sortBy`/`sortOrder`, wrap each header's copy in a `SortButton`. The 4 non-sortable `<th>` are byte-identical to today.
- **Parallel-safe with**: B2 (different files, both depend on A1 + B1 only).

### B5. Dual-locale copy — `es.json` / `en.json` / `dictionary.ts` [x]
- **Satisfies**: proposal Copy scope item; `.claude/rules/i18n-and-types.md` mandatory localization rule
- **Files**: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/lib/types/dictionary.ts`
- **Depends on**: none technically (pure data), but sequenced after B2/B3 so the exact key names match what the JSX actually references — land alongside or immediately after B2/B3, before their tests can pass end-to-end with real copy (tests can use mocked/stubbed dict values in the interim if TDD ordering requires copy before JSX in a given commit)
- Add to `TripperReviewsDict` (`dictionary.ts:482`) and `es.json`/`en.json`'s existing `tripperReviews` (es.json:3962) block: `sort: { groupLabel: string; rating: string; created: string; ariaSortBy: string; ariaAscending: string; ariaDescending: string }`
- Add to the admin `reviews` dict interface (`dictionary.ts:1399`) and `es.json`/`en.json`'s existing `adminPages.reviews` block (es.json:528, reuses existing `columns.*` titles — traveler/rating/tripper/created already exist there): `sort: { ariaSortBy: string; ariaAscending: string; ariaDescending: string }`
- Run `npm run typecheck` after adding the interface fields — this is the gate that catches a missing key in either locale file.
- **Parallel-safe with**: can be drafted in parallel with B2/B3's RED phase (copy doesn't block writing failing tests that reference `copy.sort.x` via a test-local stub), but the actual dictionary files should land before B2/B3's GREEN phase is called done end-to-end.

**Slice B exit criteria**: `ReviewsPageClient.test.tsx`, `AdminReviewsPageClient.test.tsx` GREEN. `npm run typecheck` and `npm run lint` pass (no raw `<img>`, no unused `aria-sort` misuse). Manual QA per below.

## Manual QA (explicitly not a mocked unit test — do not fabricate one)

- **Task MQ1**: With ≥1 review having `tripperId: null` ("Randomtrip") and ≥1 with a named tripper, sort the admin table by "Tripper" ascending → verify Randomtrip rows appear **last**; descending → verify they appear **first**. Also verify `total`/row count is unchanged versus sorting by "Created" (confirms the join doesn't drop null-tripper rows).
- **Why manual, not unit**: every existing lib test in this repo mocks Prisma (`tripper-queries.getTripperReviews.test.ts`, the new admin route test, `sort.test.ts` all operate on a mocked client or pure functions). True Postgres NULL-ordering semantics only manifest against a real database connection, which this repo's test infra does not provision. A1's regression-guard test (no `nulls` key, no `tripperId` filter in the emitted query) is the closest unit-level proxy and already covers the code-level regression risk (a future accidental filter); it does not and cannot prove the actual SQL ordering. Do not write a mocked "test" that asserts null placement — it would only be testing the mock's own behavior, not Postgres.

## Review Workload Forecast

**Files**: 2 new (`src/lib/reviews/sort.ts`, `src/components/ui/SortButton.tsx`) + up to 2 new test files if route/component test files don't already exist for the admin route and admin client (`sort.test.ts` and `ReviewsPageClient.test.tsx` are confirmed new regardless) + 5 modified production files (`tripper-queries.ts`, `api/tripper/reviews/route.ts`, `api/admin/reviews/route.ts`, `ReviewsPageClient.tsx`, `AdminReviewsPageClient.tsx`) + dual-locale copy in 3 files (`es.json`, `en.json`, `dictionary.ts`).

This matches the design's own Review Workload Note almost exactly — confirmed against the concrete task list above, not just repeated: the removed `review-sort-query.ts` module (~40 lines) and its dedicated test file (~40 lines) are absent from every task above (A1–A4 contain no partitioned-pagination logic, no second query, no callback-injected fakes), and the admin route's second branch is likewise absent from A3. The two client test files (B2, B3) are the largest addition (each following `RoleNotificationsPageClient.test.tsx`'s shape — several assertions per file, real but bounded).

- **Estimated new/changed lines**: roughly 60–90 for `sort.ts` + its test, 30–50 for `SortButton.tsx`, 10–15 lines each in the two modified query/route files, 40–60 lines each in the two modified client components (state + strip/th changes + fetch param wiring), 15–20 lines of dual-locale copy + type, and 60–100 lines each across the two new client test files. Total roughly **330–430 changed/added lines** — landing at the top edge of Medium, not comfortably inside it, primarily because of the two new client test files following the `RoleNotificationsPageClient.test.tsx` precedent (which itself is not small).
- **400-line budget risk**: **Medium**, consistent with the proposal and design's own estimate — but on the high side of Medium rather than the middle, because this task breakdown surfaced 2 client test files as new (not just extended) where the design's note counted "3 test files" total without specifying how much of that weight sits in the untested-today client layer. Two of those three test files (`ReviewsPageClient.test.tsx`, `AdminReviewsPageClient.test.tsx`) are net-new coverage for components with zero existing tests, which historically run longer than incremental extensions like A2's.
- **Chained PRs recommended**: **Undecided — flagging for the user, not assuming.** The natural slice boundary (A = data layer, B = UI) is clean and independently shippable (A is backward compatible alone; B cannot ship without A's param contract but A can ship and sit unused). If the combined line estimate lands near or over 400 once implemented, splitting at the A/B boundary is the lowest-risk cut. No `chain_strategy` has been chosen yet per the delivery strategy in scope (`ask-on-risk`) — this is exactly the "decision needed before apply" case that guard exists for.
- **Decision needed before apply**: **Yes** — recommend the orchestrator apply the `ask-on-risk` guard now: either confirm proceeding as a single PR with `size:exception`, or split into chained PRs at the A/B boundary (in which case `chain_strategy` — `stacked-to-main` vs `feature-branch-chain` — still needs to be chosen).

## Task Dependency Summary

```
A1 (sort.ts + test)
 ├─→ A2 (getTripperReviews)  ─┐
 ├─→ A3 (admin route)         ├─→ A4 (tripper route forwarding, needs A1+A2)
 └─→ B1 (SortButton, presentational — logically gated behind A1 for token types)
                                │
Slice A complete (A1-A4) ──────┤
                                ├─→ B2 (tripper client)  ─┐
                                ├─→ B3 (admin client)     ├─→ B5 (dual-locale copy, keys must match B2/B3 usage)
                                └─→ B1 must exist before B2/B3 JSX
```

Parallel pairs: **A2 ‖ A3** (both depend only on A1, touch different files). **B2 ‖ B3** (both depend on A1+B1, touch different files). B5 is best sequenced last within B since its key names are dictated by B2/B3's actual JSX, though it can be drafted early and reconciled.
