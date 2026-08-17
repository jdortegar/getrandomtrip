# Design: Reviews Table Sorting (Tripper + Admin)

## Technical Approach

Sorting becomes a second axis alongside the `where` axis both read paths already have. One new pure module, `src/lib/reviews/sort.ts`, owns the token vocabulary, the per-surface whitelists, the shared default, and the token→Prisma `orderBy` mapper. It is imported by the two server paths **and** by the two client components (so client default state and server default are literally the same constant). One new presentational primitive, `src/components/ui/SortButton.tsx`, renders "title + arrow" and is wrapped by a `<th>` (admin) or a header strip `<div>` (tripper). Sort state itself stays duplicated in each client, matching the prior filter/search change.

## Architecture Decisions

### Decision: shared pure sort module, not two local maps

| Option | Tradeoff |
|---|---|
| Two local whitelist maps | Matches the filter/search change's duplication, but duplicates a **security** whitelist and gives the pure logic no single test target |
| **One shared module with a per-surface allowed set** ✅ | Exact precedent already exists: `src/lib/notifications/list-query.ts` (last night's change) exports `parseNotificationStatus` — never-throw parsers + one `where` builder shared by route and query layer |

Rationale: the filter/search change duplicated a 3-line `where` spread with no security surface and nothing worth unit-testing. This change's whitelist *is* the security control (proposal risk #1) and is the precedent the next table copies. `list-query.ts` is the house pattern for exactly this.

### Decision: query params `sortBy` + `sortOrder`; tokens, not column names

`sortBy ∈ rating | created | traveler | tripper`, `sortOrder ∈ asc | desc`. Tokens are surface vocabulary decoupled from schema (`created` ≠ `createdAt`, `traveler`/`tripper` are relation hops). Rejected `sort=-rating` (single-param sign prefix): unparseable by `URLSearchParams` consumers already in these files and unlike every other param here.

### Decision: nested relation `orderBy` — verified supported; `nulls` verified NOT available

Verified against the generated client (`node_modules/.prisma/client/index.d.ts`, Prisma 7.4.1):

- `:22332` `ReviewOrderByWithRelationInput` exposes `user?: UserOrderByWithRelationInput` and `tripper?: UserOrderByWithRelationInput` → `{ user: { name: "asc" } }` / `{ tripper: { name: "asc" } }` **are** supported.
- `:21208` `UserOrderByWithRelationInput.name?: SortOrder` — plain `SortOrder`, **not** `SortOrderInput | SortOrder`, because `User.name` is non-nullable (`schema.prisma:23`). `NullsOrder` exists (`:20887`) but is reachable only on nullable scalars (`tripperId?: SortOrderInput | SortOrder`, `:22343`).

So `orderBy: { tripper: { name: { sort, nulls: "last" } } }` **does not typecheck**. Plain Postgres ordering treats NULL as greatest → `tripperId: null` ("Randomtrip") rows land **last on `asc`, first on `desc`**.

### Decision: accept Postgres' native null placement (user decision)

| Option | Tradeoff |
|---|---|
| **Omit `nulls`; accept the Postgres default** ✅ | Zero extra code, one query, `tripper` sorts exactly like the other three fields. Randomtrip lands last on `asc`, first on `desc` |
| `[{ tripperId: { sort, nulls: "last" } }, { tripper: { name } }]` | Type-legal but wrong: an opaque cuid becomes the primary key and destroys name order |
| `$queryRaw` with `ORDER BY u.name … NULLS LAST` | Duplicates the whole `where` (status + insensitive search) as SQL, needs two manual joins, and discards the typed `select` and response mapping |
| Partition into named-tripper then null-tripper groups, repaginated across the boundary | ~80 lines (module + test file) plus 2 extra queries and a bespoke pagination path, all for one of four sort options |

**Decided by the user** after this design surfaced the cost: native placement is the accepted behavior, not a compromise. `sortBy=tripper` therefore needs **no special-casing anywhere** — one nested `orderBy`, one query, same shape as `traveler`.

Spec alignment: `Requirement: Null Placement for Tripper-Name Sort` (`specs/reviews-list-sorting/spec.md:124-140`) has been amended to match — two direction-specific scenarios (`asc` → Randomtrip last, `desc` → Randomtrip first), explicitly labeled accepted behavior rather than a known gap. Design and spec now agree; nothing for `sdd-verify` to reconcile.

### Decision: deterministic tiebreakers on every sort

Ratings and names tie constantly; a tied `ORDER BY` under `skip`/`take` silently duplicates and drops rows across pages. Every sort appends `{ id: "asc" }`, and non-`created` sorts append `{ createdAt: "desc" }` first.

### Decision: default state via one shared constant (no round trip)

`REVIEW_SORT_DEFAULT = { sortBy: "created", sortOrder: "desc" }`. Both clients seed `useState` from it and **always send both params explicitly**; both server paths fall back to it. Client and server cannot drift because there is one constant. No "what's the current sort" request.

### Decision: shared `SortButton`, no shared `useSortableQuery` hook

The button is shared (proposal risk: "header strip drifts visually from the admin table"). The ~12-line state block is **not** extracted: the prior filter/search change left `statusFilter` / `searchQuery` / `debouncedSearch` / `updateStatusFilter` / `clearFilters` duplicated in both clients, and a hook that owns `sortBy`+`sortOrder` but not `page`/`status`/`search` would split one fetch's state across two owners. Extract when the whole query state moves together — a separate change.

## Interfaces / Contracts

`src/lib/reviews/sort.ts` (new — Prisma imported **type-only** so client components can import this file):

```ts
export const REVIEW_SORT_FIELDS = ["rating", "created", "traveler", "tripper"] as const;
export const TRIPPER_REVIEW_SORT_FIELDS = ["rating", "created"] as const;
export const ADMIN_REVIEW_SORT_FIELDS = REVIEW_SORT_FIELDS;
export type ReviewSortBy = (typeof REVIEW_SORT_FIELDS)[number];
export type TripperReviewSortBy = (typeof TRIPPER_REVIEW_SORT_FIELDS)[number];
export type ReviewSortOrder = "asc" | "desc";

export const REVIEW_SORT_DEFAULT = { sortBy: "created", sortOrder: "desc" } as const;
/** First-click direction per field: numeric/date → desc, names → asc. */
export const REVIEW_SORT_INITIAL_ORDER: Record<ReviewSortBy, ReviewSortOrder> = {
  created: "desc", rating: "desc", traveler: "asc", tripper: "asc",
};

/** Unknown/absent → default field. Never throws (mirrors parseNotificationStatus). */
export function parseReviewSortBy<T extends ReviewSortBy>(
  value: unknown, allowed: readonly T[],
): T | typeof REVIEW_SORT_DEFAULT.sortBy;
/** Unknown/absent → "desc". Never throws. */
export function parseReviewSortOrder(value: unknown): ReviewSortOrder;

export function reviewListOrderBy(
  sortBy: ReviewSortBy, sortOrder: ReviewSortOrder,
): Prisma.ReviewOrderByWithRelationInput[] {
  const tie = [{ createdAt: "desc" as const }, { id: "asc" as const }];
  switch (sortBy) {
    case "rating":   return [{ rating: sortOrder }, ...tie];
    case "traveler": return [{ user: { name: sortOrder } }, ...tie];
    // Nullable relation: `nulls` is not type-legal here, so Postgres' native
    // "NULL is greatest" applies — Randomtrip last on asc, first on desc.
    case "tripper":  return [{ tripper: { name: sortOrder } }, ...tie];
    case "created":
    default:         return [{ createdAt: sortOrder }, { id: "asc" as const }];
  }
}
```

This mapper is the **only** sort logic in the change — all four tokens produce one `findMany` with one `orderBy`. No branch, no second query, no extra module.

`getTripperReviews` — additive only, current behavior preserved when both are omitted:

```ts
export async function getTripperReviews(
  tripperId: string,
  options: {
    page: number; limit: number;
    status?: "all" | "approved" | "unapproved";
    search?: string;
    sortBy?: TripperReviewSortBy;   // NEW
    sortOrder?: ReviewSortOrder;    // NEW
  },
)
```

Body: destructure with `sortBy = REVIEW_SORT_DEFAULT.sortBy, sortOrder = REVIEW_SORT_DEFAULT.sortOrder`, replace `orderBy: { createdAt: "desc" }` (`:874`) with `orderBy: reviewListOrderBy(sortBy, sortOrder)`. `count` is untouched. The `switch`'s `default` branch is the second whitelist gate for any caller bypassing the route.

Both routes parse next to the existing `rawStatus` block:

```ts
const sortBy = parseReviewSortBy(searchParams.get("sortBy"), TRIPPER_REVIEW_SORT_FIELDS); // ADMIN_… in admin
const sortOrder = parseReviewSortOrder(searchParams.get("sortOrder"));
```

Admin route replaces `orderBy: { createdAt: "desc" }` (`route.ts:46`) with `orderBy: reviewListOrderBy(sortBy, sortOrder)` for all four tokens. `where`, `select`, `skip`/`take`, `prisma.review.count({ where })`, and the `rawReviews.map(...)` → `tripperName` mapping (`route.ts:74-78`) are all untouched.

## Client Structure

`src/components/ui/SortButton.tsx` (new). Icons: `ArrowUpDown` inactive, `ArrowUp` asc, `ArrowDown` desc (all `lucide-react`, `h-3.5 w-3.5` — matches the existing 11px header text and the filter row's `X` sizing). Inactive arrow stays **visible** at `text-neutral-300` rather than opacity-hidden until hover, per the design-system rule against opacity as an off-state.

```tsx
<button type="button" onClick={onSort} aria-label={ariaLabel} aria-pressed={ariaPressed}
  className={cn(
    "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
    active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700",
  )}>
  {label}
  <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-light-blue" : "text-neutral-300")} />
</button>
```

`aria-pressed` is passed only by the tripper strip; the admin table passes `undefined` and uses `aria-sort` on the `<th>` instead (`aria-sort` is only valid on `columnheader`).

**Tripper (`ReviewsPageClient.tsx`)** — no new local component; a strip between the existing `<h3>` header div and the `<ul>`, styled as the design-system table header row:

```tsx
<div aria-label={copy.sort.groupLabel} className="flex items-center gap-6 border-b border-gray-200 bg-gray-50 px-5 py-3" role="group">
  <SortButton active={sortBy === "rating"} ariaPressed={sortBy === "rating"} label={copy.sort.rating} … />
  <SortButton active={sortBy === "created"} ariaPressed={sortBy === "created"} label={copy.sort.created} … />
</div>
```

**Admin (`AdminReviewsPageClient.tsx`)** — the 4 sortable `<th>` (traveler, rating, tripper, created) drop their text classes (SortButton carries them) and keep only `px-5 py-3 text-left`, plus:

```tsx
<th aria-sort={sortBy === "traveler" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
    className="px-5 py-3 text-left">
  <SortButton active={sortBy === "traveler"} label={cols.traveler} onSort={() => toggleSort("traveler")} order={sortOrder} />
</th>
```

The 4 non-sortable `<th>` (review, status, tripId, actions) are byte-identical to today — no `aria-sort`, no button.

Toggle handler, duplicated per surface, reusing the existing `setPage(1)` convention:

```ts
function toggleSort(field: ReviewSortBy) {
  if (field === sortBy) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  else { setSortBy(field); setSortOrder(REVIEW_SORT_INITIAL_ORDER[field]); }
  setPage(1);
}
```

Fetch effects add `params.set("sortBy", sortBy)` / `params.set("sortOrder", sortOrder)` and add both to the dep arrays.

## Data Flow

    SortButton click → toggleSort(field) → setSortBy/setSortOrder + setPage(1)
        │
        └─ useEffect dep change → GET ?page=1&limit=20&status&search&sortBy&sortOrder
               │
               ├─ /api/tripper/reviews  → parseReviewSortBy(…, TRIPPER_REVIEW_SORT_FIELDS)
               │      → getTripperReviews(…, { sortBy, sortOrder }) → reviewListOrderBy() → Prisma
               └─ /api/admin/reviews    → parseReviewSortBy(…, ADMIN_REVIEW_SORT_FIELDS)
                      → reviewListOrderBy() → prisma.review.findMany({ where, orderBy })

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/reviews/sort.ts` | Create | Tokens, per-surface whitelists, `REVIEW_SORT_DEFAULT`, never-throw parsers, `reviewListOrderBy` |
| `src/components/ui/SortButton.tsx` | Create | Shared title+arrow affordance |
| `src/lib/db/tripper-queries.ts` | Modify | `getTripperReviews` +`sortBy?`/`sortOrder?`; `orderBy` at `:874` |
| `src/app/api/tripper/reviews/route.ts` | Modify | Parse sort params, forward to `getTripperReviews` |
| `src/app/api/admin/reviews/route.ts` | Modify | Parse sort params; `orderBy` at `:46` |
| `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` | Modify | Sort strip, state, fetch params |
| `src/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient.tsx` | Modify | 4 sortable `<th>`, state, fetch params |
| `src/dictionaries/{es,en}.json` + `src/lib/types/dictionary.ts` | Modify | `tripperReviews.sort` = `{ groupLabel, rating, created, ariaSortBy, ariaAscending, ariaDescending }`; `adminPages.reviews.sort` = `{ ariaSortBy, ariaAscending, ariaDescending }` (admin reuses existing `columns.*` titles) |

## Testing Strategy

Vitest + happy-dom, colocated `__tests__/`, prisma mocked per `src/lib/db/__tests__/tripper-queries.getTripperReviews.test.ts`. Highest-value RED cases:

| Layer | Scenario |
|---|---|
| `src/lib/reviews/__tests__/sort.test.ts` (new, pure) | Each of the 4 tokens → exact `orderBy` array, **including** `{ user: { name } }` / `{ tripper: { name } }` nesting and the assertion that the `tripper` case carries **no** `nulls` key and **no** `tripperId` filter (native placement is deliberate, and a future "fix" that filters nulls out would silently drop Randomtrip rows); **invalid `sortBy` falls back to `created` while a valid `sortOrder` is still honored** (`?sortBy=isApproved&sortOrder=asc` → `[{createdAt:"asc"},{id:"asc"}]`); `sortOrder` garbage → `desc`; **no emitted key is outside `{rating, createdAt, user, tripper, id}`** (whitelist containment — catches future edits, not just today's); every result ends with a tiebreaker (pagination stability) |
| `…/tripper-queries.getTripperReviews.test.ts` (extend) | Omitted sort params → `orderBy[0] === { createdAt: "desc" }` (backward compat + honest default state); `{ sortBy: "rating", sortOrder: "asc" }` → `orderBy[0] === { rating: "asc" }`; **`where` is byte-identical with and without sort params** (sorting must never silently narrow the result set) |
| Client (`AdminReviewsPageClient.test.tsx`, `ReviewsPageClient.test.tsx` — new, per `RoleNotificationsPageClient.test.tsx`) | First fetch URL contains `sortBy=created&sortOrder=desc` and the Created header renders active-descending with **zero** extra requests; click Rating → `sortBy=rating&sortOrder=desc&page=1`, click again → `sortOrder=asc`; **combined**: with `status=approved` + `search=Ana` active on page 3, clicking a sort header yields a URL keeping both and `page=1`; admin `<thead>` exposes exactly 4 buttons; `aria-sort` is `none` on inactive sortable headers and absent on non-sortable ones |
| Manual QA (no DB-backed test infra exists — every lib test mocks Prisma) | Sort by tripper name with ≥1 `tripperId: null` row: Randomtrip rows **last on `asc`, first on `desc`** (accepted native behavior), and `total` / row count unchanged vs the created sort — the one thing a mocked Prisma cannot prove is that the relation join preserves null-tripper rows |

## Migration / Rollout

No migration required — code only, no `prisma/schema.prisma` diff. Endpoints are backward compatible: absent params reproduce today's order (plus a deterministic tiebreaker), so reverting only the clients is safe.

## Review Workload Note

Accepting native null placement removed the module that was pushing this past the 400-line budget: `src/lib/db/review-sort-query.ts` (~40 lines), its dedicated test file (~40 lines), and the admin route's second branch are all gone. The change is back at the proposal's **Medium** risk — 2 new files (one pure module, one small UI primitive), 5 modified files, dual-locale copy, and 3 test files. `tasks.md` has not been written yet, so it will forecast against this reduced shape from the start rather than inheriting a High-risk estimate. The proposal's A/B slice boundary (data layer, then UI) remains the natural split if chaining is still chosen.

## Open Questions

- [x] Null placement resolved by user decision and already reflected in both artifacts: spec amended to two direction-specific scenarios, design simplified to one nested `orderBy`. No divergence left.
- [ ] Noted for verify: the `{ id: "asc" }` tiebreaker is a deliberate, deterministic superset of today's ordering, not a regression.
