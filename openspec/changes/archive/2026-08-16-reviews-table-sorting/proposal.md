# Proposal: Reviews Table Sorting (Tripper + Admin)

## Intent

Both reviews surfaces — the tripper's own reviews page and the admin reviews page — render in one fixed order (`createdAt desc`, hardcoded server-side) with no way for the user to change it. After tonight's filter + search addition, a tripper with a long review history still cannot answer "show me my worst ratings first", and an admin cannot group a moderation queue by reviewer or by tripper.

The ask was sorting on rating, created, "and the ones that make more sense". The structurally important fact is that **no sorting convention exists anywhere in this app today**: zero `sortBy` / `sortOrder` / `sortDirection` / `SortableHeader` matches under `src/components/app/dashboard/` or `src/app/api/`, all 16 `orderBy` occurrences across API routes are hardcoded literals, and no clickable sort header exists on any table (`RecentPaymentsTable`, `ExperiencesPageClient`, `TravelerTripsTable`, `AdminPaymentsPageClient`, `AdminExperiencesPageClient`, `AdminBlogPageClient` all checked). **This change sets the first sort precedent in the codebase** — query-param naming, icon language, and whitelist validation chosen here are what the next table will copy.

## Current State (researched, not assumed)

- **The two surfaces have different markup shapes.** `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` is a card/list layout (`<ul><li>`) with **no header row at all**. `src/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient.tsx` is a real `<table>` with 8 columns: traveler, review, rating, status, tripper, tripId, created, actions.
- **Backend hardcodes order, reads no sort params.** `getTripperReviews` (`src/lib/db/tripper-queries.ts:846-902`, `orderBy` at :874) already accepts `{ page, limit, status?, search? }` from tonight's change. `GET /api/admin/reviews` (`src/app/api/admin/reviews/route.ts`, `orderBy` at :46) already reads `page`, `limit`, `status`, `search`.
- **`Review`** (`prisma/schema.prisma:395-421`): `rating Int`, `isApproved Boolean`, `createdAt DateTime`, relations `user User` (traveler, `.name`) and `tripper User?` (nullable self-relation `"TripperReviews"`, `.name`, exposed as `tripperName` by the admin API). No separate Tripper model — trippers are Users with a role.

## Decision Log

All decisions were resolved in a live grill-me session against the code and are **final**.

| # | Decision |
|---|----------|
| 1 | **The tripper page gets a header row retrofitted above the existing `<ul>`** — clickable "column title + arrow" labels matching the admin table's affordance, even though the markup is a label row, not a `<thead>`. Explicit user choice after two clarification rounds; a dropdown-based sort control and "skip the tripper page" were both rejected. |
| 2 | **Sortable fields — tripper page: `rating`, `created` only.** That page is already scoped to one tripper (`where: { tripperId }`), so a tripper-name sort is meaningless, and a reviewer-name sort was not asked for on this narrower surface. |
| 3 | **Sortable fields — admin page: `rating`, `created`, traveler name (`user.name`), tripper name (`tripper.name`).** The last two are relation sorts; `tripper` is nullable. |
| 4 | **`status` / `isApproved` is DROPPED as a sort field**, despite being named in the original ask. A filter dropdown (All / Approved / Unapproved) already expresses exactly that distinction, there is zero precedent for sorting a boolean anywhere in the app, and a 2-value sort is really "group X first" — a filter concern. The user chose to drop it rather than ship a redundant control. |
| 5 | **`review` (title/content preview) and `tripId` are NOT sortable.** Free text and an opaque cuid have no meaningful natural order. Stated as an explicit non-goal so `sdd-verify` does not read their absence as a gap. |
| 6 | **Default state shows "Created" as actively sorted descending on load**, not neutral. Both pages already *are* `createdAt desc`; a neutral-looking header would misrepresent data that is genuinely ordered. One click flips to ascending (oldest first). |
| 7 | **Sorting is server-side only** — Prisma `orderBy` driven by query params. Both pages are server-paginated; client-side re-sorting would reorder only the current page's rows and produce a wrong global order. Hard technical constraint, not a preference. |
| 8 | **Changing sort field or direction resets to page 1**, matching the `updateFilter` pattern established by tonight's filter/search change and by `ExperiencesPageClient.tsx`. |
| 9 | **Visual language: a simple arrow icon next to each column title** (user's words). Sortable-but-inactive columns get a neutral affordance; the active column gets a direction-specific arrow. Exact icons (e.g. lucide `ArrowUp` / `ArrowDown` / `ArrowUpDown`) are a design-phase call — no existing convention to conflict with. The only `ArrowUpRight` in dashboard tables is an unrelated "open external link" affordance. |

## Scope

### In Scope

**API / data layer**
- One query-param convention (e.g. `sortBy` + `sortOrder`) chosen once in design and applied to **both** the tripper reviews read path and `GET /api/admin/reviews`.
- `getTripperReviews` options extended additively with `sortBy?` / `sortOrder?` (allowed: rating, created).
- `GET /api/admin/reviews` reads the same params (allowed: rating, created, traveler, tripper).
- **Whitelist mapping** from the client-supplied value to a fixed Prisma `orderBy` object in both places.
- Relation sorts via nested `orderBy` (`{ user: { name } }`, `{ tripper: { name } }`), with a decided null-placement behavior for tripper-name sort (`tripperId: null` rows display as "Randomtrip").

**Client**
- New sortable header row above the tripper page's `<ul>` (rating, created).
- Sortable `<th>` treatment on the admin table (traveler, rating, tripper, created); the other four columns stay static.
- Sort state resets `page` to 1 and composes with the existing `status` filter and `search`.
- "Created descending" rendered as the active default on first load.

**Copy**
- Sort-affordance strings (column sort labels / `aria-label`s / `aria-sort` text as design decides) added to **both** `src/dictionaries/es.json` and `en.json` (+ `src/lib/types/dictionary.ts`), extending the existing reviews sections.

### Out of Scope

- Sorting on `status` / `isApproved` (decision 4).
- Sorting on `review` (title/content) or `tripId` (decision 5).
- Any client-side-only sorting.
- Changes to the existing `status` filter or `search` behavior — this change is purely additive to them.
- Sorting on any other table in the app (experiences, blog, notifications, payments, trip requests) — reviews only, even though this establishes a pattern others may copy later.
- Multi-column / secondary sort, URL persistence of sort state, and per-user sort preference persistence.
- Any `prisma/schema.prisma` change.

## Capabilities

### New Capabilities

- `reviews-list-sorting`: the sort contract for both reviews surfaces — the allowed sort fields per surface, server-side-only enforcement, whitelist validation, the created-descending default and its rendered active state, direction toggling, relation and null ordering, and how sort composes with filter / search / pagination.

### Modified Capabilities

- None. No existing spec under `openspec/specs/` constrains reviews list ordering (verified: the only ordering requirement anywhere is `05-traveler-dashboard.md:54`, about notifications).

## Approach

The leverage is that both read paths were just touched by tonight's filter/search change and already have a params-in / `where`-out shape; sorting slots in as a second axis alongside `where`. Nothing is rearchitected — `getTripperReviews`'s options object and the admin route's `searchParams` parsing each gain two optional fields, and each gains one pure mapper from a whitelisted token to a Prisma `orderBy` object. Because the whitelists differ per surface (2 fields vs 4), design decides whether they share one helper with a per-surface allowed set or stay two small local maps; the shared param *names* are non-negotiable either way, since the next table to get sorting will copy them.

On the client, the admin table is the easy half: `<th>` contents become buttons with an arrow, wired through the same `page`-resetting state updater the filter already uses. The tripper page is the interesting half — it has no header row to make clickable, so one is added as a label strip above the `<ul>`. The design must keep that strip visually and semantically honest: it is a sort control bar, not a `<thead>`, so it needs its own accessible treatment rather than borrowing `aria-sort` semantics that only apply inside a real table.

The whitelist is a security requirement, not hygiene. Passing a raw client string into a dynamic `orderBy` key would let a caller order by arbitrary fields or traverse relations — Prisma's typed client makes a true injection unlikely, but the footgun is real and this is the file future tables will copy.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/db/tripper-queries.ts` (`getTripperReviews`, :846-902) | Modified | Additive `sortBy?` / `sortOrder?`, whitelist → `orderBy`, replacing the hardcoded :874 |
| `src/app/api/admin/reviews/route.ts` | Modified | Parse + whitelist sort params, replacing the hardcoded :46 |
| Tripper reviews read path (server page / route feeding `ReviewsPageClient`) | Modified | Forward sort params |
| `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` | Modified | New sortable header strip above the `<ul>`; sort state + page reset |
| `src/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient.tsx` | Modified | Sortable `<th>` for traveler / rating / tripper / created |
| Shared sort header component (location TBD in design) | New | Reusable "title + arrow" affordance used by both surfaces |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | Sort labels / a11y strings, dual-locale |

**Size**: materially smaller than `notifications-filter-and-bulk-delete` — no new endpoints, no mutations, no schema change, no data-flow inversion, and both read paths were already opened up by tonight's change. But it does touch two UIs, two query paths, dual-locale copy, and a new shared component, and strict TDD applies. Expect **Medium** 400-line budget risk. Natural slice boundary if chaining is chosen: **(A)** data layer — param convention + both whitelists + relation/null ordering; **(B)** UI — shared sort header, both surfaces, copy. A precedes B.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Raw client sort value reaches a dynamic Prisma `orderBy` key | Med | Explicit whitelist → literal `orderBy` object in both paths; test that an unknown value falls back to the default instead of throwing or ordering arbitrarily |
| Sort silently applies per-page instead of globally (regressing to client-side behavior) | Med | Server-side is a spec requirement; test that sorting with `limit` smaller than the total returns the true global first page, not a reordered page 1 |
| Nullable `tripper` relation sort places "Randomtrip" rows unpredictably or differs between asc and desc | Med | Design decides and specs null placement explicitly; test both directions with at least one `tripperId: null` row |
| Stale sort combined with filter/search leaves the user on a page that no longer exists | Med | Reset `page` to 1 on every sort change (decision 8); reuse the existing `updateFilter` path rather than a parallel updater |
| Nested `orderBy` on the `user` / `tripper` relations turns out unsupported for these exact shapes | Low | Verify against the generated client during design; fallback is documented before tasks, not improvised at apply time |
| Tripper header strip drifts visually from the admin table's headers | Low | One shared sort-header component (Affected Areas) rather than two implementations |
| Accessibility: `aria-sort` misapplied outside a real table on the tripper page | Low | Spec the a11y treatment per surface; buttons with localized labels, not icon-only affordances |
| "Created" renders as neutral on load, misrepresenting the true order | Low | Decision 6 is a spec requirement with its own test |
| Missing `en` / `es` copy | Low | Dual-locale keys enforced by `.claude/rules/i18n-and-types.md`; typecheck gates the dict type |

## Rollback Plan

Code-only — **no schema change, no migration**. A straight revert restores the hardcoded `createdAt desc` on both surfaces exactly. The API changes are backward compatible on their own: with no sort params supplied, both paths must return today's order, so reverting only the client leaves the endpoints harmless and functional. If a relation sort misbehaves in production, the narrowest fix is to shrink the whitelist (drop `traveler` / `tripper`) without touching the UI beyond hiding those affordances.

## Dependencies

- **Hard prerequisite**: tonight's reviews filter + search change (the `{ page, limit, status?, search? }` signature at `src/lib/db/tripper-queries.ts:846` and the admin route's param parsing) must be in the tree — verified present, but currently uncommitted, so apply must not be run against a reverted or partially-landed base.
- **Ordering**: the param convention and whitelists (slice A) land before or with the UI (slice B).
- No new libraries. Existing primitives only; icons from the already-installed `lucide-react`.
- Vitest + happy-dom (strict TDD active): spec / design / tasks must plan RED/GREEN coverage for whitelist rejection, global-vs-page-scoped ordering, null placement on tripper-name sort, page reset on sort change, and the created-descending default state.

## Success Criteria

- [ ] Tripper reviews page has a clickable header row (rating, created) above the card list, visually consistent with the admin table headers.
- [ ] Admin reviews table sorts by traveler, rating, tripper, and created; review and tripId expose no sort affordance.
- [ ] No sort affordance exists for status / `isApproved` on either surface.
- [ ] On first load, both pages show "Created" as actively sorted **descending**; one click yields oldest-first.
- [ ] Sorting is server-side: with pagination active, page 1 reflects the globally sorted first page — verified by test.
- [ ] An unknown or malformed sort value is rejected by the whitelist and falls back to the default order — verified by test.
- [ ] Sorting by tripper name places `tripperId: null` ("Randomtrip") rows per the specced rule in both directions — verified by test.
- [ ] Changing sort field or direction resets to page 1 and preserves the active `status` filter and `search`.
- [ ] Existing filter + search behavior is unchanged (no regression in their tests).
- [ ] No `prisma/schema.prisma` diff.
- [ ] All new copy present in `es` and `en`; `npm run typecheck` and the vitest suite pass.
