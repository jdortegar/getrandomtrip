# Reviews List Sorting Specification

## Purpose

Contract for server-side sorting on the two reviews surfaces — the tripper's own reviews page (`ReviewsPageClient`, scoped to one tripper) and the admin reviews table (`AdminReviewsPageClient`) — establishing the first sort convention in the codebase: per-surface allowed sort fields, whitelist validation against a dynamic Prisma `orderBy`, the created-descending default and its rendered active state, direction toggling, relation/null ordering for the nullable `tripper` relation, and composition with the existing `status` filter and `search` from the prior change.

## Requirements

### Requirement: Tripper Page Sortable Fields

The tripper reviews page MUST offer a sort control for `rating` and `created` only, above the existing review card list.

#### Scenario: Sort tripper reviews by rating ascending

- GIVEN the tripper reviews page with reviews of varying ratings
- WHEN the tripper selects "rating" ascending
- THEN the list re-renders ordered by rating from lowest to highest

#### Scenario: Sort tripper reviews by rating descending

- GIVEN the tripper reviews page with reviews of varying ratings
- WHEN the tripper selects "rating" descending
- THEN the list re-renders ordered by rating from highest to lowest

#### Scenario: Sort tripper reviews by created ascending

- GIVEN the tripper reviews page with reviews created at different times
- WHEN the tripper selects "created" ascending
- THEN the list re-renders oldest-first

#### Scenario: Sort tripper reviews by created descending

- GIVEN the tripper reviews page with reviews created at different times
- WHEN the tripper selects "created" descending
- THEN the list re-renders newest-first

#### Scenario: No sort control for status/isApproved on the tripper page (non-goal, not a gap)

- GIVEN the tripper reviews page's sort control
- WHEN the tripper inspects the available sort options
- THEN no option to sort by `status` / `isApproved` exists
- AND this absence is deliberate — the existing status filter dropdown already expresses that distinction

#### Scenario: No traveler-name or tripper-name sort control on the tripper page (non-goal, not a gap)

- GIVEN the tripper reviews page is already scoped to a single tripper (`where: { tripperId }`)
- WHEN the tripper inspects the available sort options
- THEN no option to sort by traveler name or tripper name exists
- AND this absence is deliberate — a tripper-name sort is meaningless on a page already filtered to one tripper, and a reviewer-name sort was never requested for this narrower surface

### Requirement: Admin Page Sortable Fields

The admin reviews table MUST offer a sort control for `rating`, `created`, traveler name (`user.name`), and tripper name (`tripper.name`) columns only.

#### Scenario: Sort admin reviews by rating ascending

- GIVEN the admin reviews table with reviews of varying ratings
- WHEN the admin selects "rating" ascending
- THEN the table re-renders ordered by rating from lowest to highest

#### Scenario: Sort admin reviews by rating descending

- GIVEN the admin reviews table with reviews of varying ratings
- WHEN the admin selects "rating" descending
- THEN the table re-renders ordered by rating from highest to lowest

#### Scenario: Sort admin reviews by created ascending

- GIVEN the admin reviews table with reviews created at different times
- WHEN the admin selects "created" ascending
- THEN the table re-renders oldest-first

#### Scenario: Sort admin reviews by created descending

- GIVEN the admin reviews table with reviews created at different times
- WHEN the admin selects "created" descending
- THEN the table re-renders newest-first

#### Scenario: Sort admin reviews by traveler name ascending

- GIVEN the admin reviews table with reviews from travelers with different names
- WHEN the admin selects "traveler" ascending
- THEN the table re-renders ordered by `user.name` A→Z

#### Scenario: Sort admin reviews by traveler name descending

- GIVEN the admin reviews table with reviews from travelers with different names
- WHEN the admin selects "traveler" descending
- THEN the table re-renders ordered by `user.name` Z→A

#### Scenario: Sort admin reviews by tripper name ascending

- GIVEN the admin reviews table with reviews attributed to trippers with different names
- WHEN the admin selects "tripper" ascending
- THEN the table re-renders ordered by `tripper.name` A→Z, subject to the null-placement rule below

#### Scenario: Sort admin reviews by tripper name descending

- GIVEN the admin reviews table with reviews attributed to trippers with different names
- WHEN the admin selects "tripper" descending
- THEN the table re-renders ordered by `tripper.name` Z→A, subject to the null-placement rule below

#### Scenario: No sort control for status/isApproved on the admin page (non-goal, not a gap)

- GIVEN the admin reviews table's sort control
- WHEN the admin inspects the available sort options
- THEN no option to sort by `status` / `isApproved` exists
- AND this absence is deliberate — the existing All/Approved/Unapproved filter already expresses that distinction, and there is no precedent for sorting a boolean in this app

#### Scenario: No sort control for review content on the admin page (non-goal, not a gap)

- GIVEN the admin reviews table's sort control
- WHEN the admin inspects the available sort options
- THEN no option to sort by the review title/content column exists
- AND this absence is deliberate — free text has no meaningful natural order

#### Scenario: No sort control for tripId on the admin page (non-goal, not a gap)

- GIVEN the admin reviews table's sort control
- WHEN the admin inspects the available sort options
- THEN no option to sort by `tripId` exists
- AND this absence is deliberate — an opaque cuid has no meaningful natural order

### Requirement: Null Placement for Tripper-Name Sort

When sorting the admin reviews table by tripper name, reviews with `tripperId: null` (displayed as "Randomtrip" in the UI) MUST follow Postgres' native null-placement behavior: nulls sort as "greatest" by default, so direction determines whether "Randomtrip" rows land first or last. This is the accepted, correct behavior for this field — not a compromise or a known gap.

#### Scenario: Ascending tripper-name sort places Randomtrip rows last

- GIVEN a mix of reviews with a non-null `tripper` and reviews with `tripperId: null`
- WHEN the admin selects "tripper" ascending
- THEN all reviews with a named tripper appear first, ordered A→Z
- AND all `tripperId: null` ("Randomtrip") rows appear after every named-tripper row

#### Scenario: Descending tripper-name sort places Randomtrip rows first

- GIVEN a mix of reviews with a non-null `tripper` and reviews with `tripperId: null`
- WHEN the admin selects "tripper" descending
- THEN all `tripperId: null` ("Randomtrip") rows appear first
- AND all reviews with a named tripper follow, ordered Z→A

### Requirement: Default Sort State Reflects Actual Order

On first load, before any user sort interaction, both reviews surfaces MUST render "Created" as the actively sorted column, in descending order — matching the real hardcoded order both surfaces already produce.

#### Scenario: Tripper page initial load shows Created descending as active

- GIVEN a tripper navigates to their reviews page for the first time in a session
- WHEN the page renders with no sort interaction yet performed
- THEN the "Created" sort control shows a descending-active visual state (not a neutral/unsorted state)
- AND the rendered reviews are ordered newest-first

#### Scenario: Admin page initial load shows Created descending as active

- GIVEN an admin navigates to the reviews table for the first time in a session
- WHEN the page renders with no sort interaction yet performed
- THEN the "Created" column header shows a descending-active visual state (not a neutral/unsorted state)
- AND the rendered reviews are ordered newest-first

### Requirement: Server-Side Whitelisted Sort Validation

Both the tripper reviews read path and `GET /api/admin/reviews` MUST validate the incoming sort field against a fixed per-surface whitelist before mapping to a Prisma `orderBy` object. A raw client-supplied value MUST NOT be passed directly into a dynamic `orderBy` key.

#### Scenario: Unknown sortBy value on the tripper reviews path falls back safely

- GIVEN a request to the tripper reviews read path with an unrecognized `sortBy` value (e.g. one not in `{rating, created}`)
- WHEN the request is processed
- THEN the server does not throw and does not pass the raw value into `orderBy`
- AND the response falls back to the default order (created descending)

#### Scenario: Unknown sortBy value on the admin reviews route falls back safely

- GIVEN a request to `GET /api/admin/reviews` with an unrecognized `sortBy` value (e.g. one not in `{rating, created, traveler, tripper}`)
- WHEN the request is processed
- THEN the server does not throw and does not pass the raw value into `orderBy`
- AND the response falls back to the default order (created descending)

#### Scenario: Malformed sortOrder value falls back to the default direction

- GIVEN a request to either read path with a `sortOrder` value that is neither `asc` nor `desc`
- WHEN the request is processed
- THEN the server falls back to `desc` rather than throwing or passing the raw value through

### Requirement: Sort Is Globally Ordered, Not Page-Scoped

Sorting MUST be applied server-side via Prisma `orderBy` across the full result set before pagination, not re-ordered client-side within an already-fetched page.

#### Scenario: Sorted page 1 reflects the true global order under pagination

- GIVEN more reviews exist than fit on one page, with `limit` smaller than the total row count
- WHEN a sort is applied (e.g. rating ascending)
- THEN page 1 contains the globally lowest-rated reviews across the entire result set
- AND it is not simply the default-ordered page 1 re-sorted internally

### Requirement: Sort Composes With Filter, Search, and Pagination

Changing the sort field or direction MUST reset the current page to 1, and the active sort MUST combine with the existing `status` filter and `search` term rather than overriding or being overridden by them.

#### Scenario: Changing sort resets to page 1

- GIVEN the admin or tripper reviews page is on page 2 or later
- WHEN the user changes the sort field or toggles direction
- THEN the view returns to page 1 reflecting the new sort

#### Scenario: Sort, filter, and search apply simultaneously

- GIVEN the admin reviews table has the `status` filter set to "Unapproved" and a `search` term entered for a traveler name
- WHEN the admin also selects "rating" ascending
- THEN the returned rows satisfy all three conditions at once: `isApproved: false`, matching the search term, ordered by rating ascending
- AND none of the three conditions is dropped or overridden by applying the others

## Non-Goals (Explicit, Not Gaps)

- No sort control for `status` / `isApproved` on either surface — the existing status filter already expresses that distinction, and there is no precedent for sorting a boolean in this app.
- No sort control for review content (title/content) or `tripId` on the admin page — free text and an opaque cuid have no meaningful natural order.
- No traveler-name or tripper-name sort control on the tripper page — that page is already scoped to a single tripper, making both meaningless.
- No client-side-only sorting — sorting is server-side via Prisma `orderBy` on both read paths; a client-side re-sort of an already-paginated page is explicitly out of scope and would be a defect if introduced.
- No changes to the existing `status` filter or `search` behavior from the prior change — this change is purely additive alongside them.
- No sorting added to any other table in the app (experiences, blog, notifications, payments, trip requests) — this spec governs the reviews surfaces only, even though it establishes the pattern.
- No multi-column / secondary sort, no URL persistence of sort state, and no per-user persisted sort preference.
- No `prisma/schema.prisma` change.
