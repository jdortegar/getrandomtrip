# Tasks: Tripper ↔ Experience Linking

## Change Name
`tripper-experience-linking`

## Status
`tasks-ready`

## Delivery Strategy
Stacked-to-main chained PRs — 4 PRs in dependency order.

---

## PR Chain Overview

```
PR-1: Schema  →  PR-2: APIs  →  PR-3: UI (landing + journey)  →  PR-4: Admin
```

Each PR is independently deployable. Subsequent PRs depend on the merged state of prior ones.

---

## PR-1 — Schema + DB Push

**Branch**: `feat/tel-schema`
**Spec requirements**: §3.1, §5 (invariant: tripperId nullable, SetNull on delete)
**Estimated changed lines**: ~20

### T-01 · Add `tripperId` FK to `TripRequest` model
- **File**: `prisma/schema.prisma`
- **Action**: Add `tripperId String?` field to `TripRequest`; add `@relation("TripperTripRequests", fields: [tripperId], references: [id], onDelete: SetNull)` referencing `User`; add inverse `tripRequests TripRequest[] @relation("TripperTripRequests")` on `User` model.
- **Spec**: §3.1
- **Sequential**: must be first; all other PRs depend on this field existing in DB.

### T-02 · Run `db push` and `prisma generate`
- **Command**: `npm run db:push && npm run db:generate`
- **Action**: Apply nullable column to local + staging DB. Verify existing rows have `tripperId = null`.
- **Spec**: §3.1, §5
- **Sequential**: after T-01.

---

## PR-2 — API Layer

**Branch**: `feat/tel-api`
**Base**: `feat/tel-schema` (or main after PR-1 merges)
**Spec requirements**: §4.1 (blog), §4.2 (attribution), §4.8 (admin), §4.9 (earnings)
**Estimated changed lines**: ~250

### [x] T-03 · Add `getTripperJourneyContext` query helper
- **File**: `src/lib/db/tripper-queries.ts`
- **Action**: Add function `getTripperJourneyContext(slug: string): Promise<TripperJourneyContext | null>`. Query tripper by `tripperSlug`. Filter `Experience` where `ownerId = tripper.id AND status = ACTIVE`. Return `{ name, avatarUrl, allowedTypes: distinct flat-mapped types, allowedLevelsByType: grouped by type → distinct levels }`. Use `{ has: value }` array semantics only.
- **Spec**: §4.3, §4.4, §4.5, §4.6
- **Interface**: `TripperJourneyContext` from design §Interfaces
- **Parallel**: can be done alongside T-04.

### [x] T-04 · Fix `availableTypes` query to require `status: ACTIVE`
- **File**: `src/lib/db/tripper-queries.ts`
- **Action**: In `getTripperBySlug`, change the `Experience.findMany` where clause from `isActive: true` to `isActive: true, status: "ACTIVE"`. This is an additive filter; no return type change.
- **Spec**: §4.1 (S1, S2)
- **Parallel**: can be done alongside T-03.

### [x] T-05 · Create `GET /api/trippers/[slug]/journey-context` route
- **File**: `src/app/api/trippers/[slug]/journey-context/route.ts` (new file)
- **Action**: Export `GET` handler. Extract `slug` from route params. Call `getTripperJourneyContext(slug)`. Return 200 with JSON body or 404 if null. No auth required (public endpoint).
- **Spec**: §4.3–4.6; Design AD-4
- **Sequential**: after T-03.

### [x] T-06 · Resolve `tripper` slug in `POST /api/trip-requests`
- **File**: `src/app/api/trip-requests/route.ts`
- **Action**: In the POST handler, accept optional `body.tripper` (slug string). If present, query `User.findFirst({ where: { tripperSlug: body.tripper } })` to resolve to `id`. Set `tripperId` on the `TripRequest.create` call. If slug not found, set `tripperId: null` — do not throw. If `body.tripper` absent, `tripperId` stays null.
- **Spec**: §4.2 (S5, S6, S7)
- **Sequential**: after T-02 (schema field must exist).

### [x] T-07 · Add query filters to `GET /api/admin/experiences`
- **File**: `src/app/api/admin/experiences/route.ts`
- **Action**: Read optional query params `tripperId`, `level`, `type`, `status`. Build `where` clause additions: `ownerId: tripperId` if present; `level` if present; `type: { has: type }` if present; `status: status` if present. These are all additive ANDs on the existing filter chain.
- **Spec**: §4.8 (S12, S13)
- **Parallel**: can be done alongside T-06.

### [x] T-08 · Derive `actualDestination` on experience assignment in `PATCH /api/admin/trip-requests/[id]`
- **File**: `src/app/api/admin/trip-requests/[id]/route.ts`
- **Action**: When PATCH body includes `experienceId`, after persisting `TripRequest.experienceId`, fetch the assigned experience and compute `actualDestination = "${experience.destinationCity}, ${experience.destinationCountry}"`. Write that value back with a second `prisma.tripRequest.update`. Do NOT set `actualDestination` when `experienceId` is absent from the body.
- **Spec**: §4.8 (S14), §5 (invariant: actualDestination not set by admin manually)
- **Sequential**: after T-02.

### [x] T-09 · Update Tripper OS earnings queries to use `tripperId`
- **File**: `src/lib/db/tripper-queries.ts`
- **Action**: In the stats/earnings aggregation function(s), add a secondary attribution count: `TripRequest.count({ where: { tripperId: tripper.userId, status: { in: [CONFIRMED, COMPLETED] } } })`. Keep `experience.ownerId`-based commission earnings unchanged. Expose the new count as `attributedBookings` (or equivalent) in the stats return shape.
- **Spec**: §4.9 (S15, S16)
- **Sequential**: after T-02.

---

## PR-3 — UI: Tripper Landing + Journey

**Branch**: `feat/tel-ui`
**Base**: `feat/tel-api` (or main after PR-2 merges)
**Spec requirements**: §4.1, §4.3–4.7
**Estimated changed lines**: ~220

### [x] T-10 · Remove mock blog data from tripper landing page
- **File**: `src/app/[locale]/trippers/[tripper]/page.tsx`
- **Action**: Delete `MOCK_BLOG_POSTS` constant (or import). Change Blog section render to: `{publishedBlogs.length > 0 && <Blog posts={publishedBlogs} ... />}`. If `publishedBlogs` is not yet fetched, add a query for `BlogPost.findMany({ where: { authorId: tripper.id, status: "PUBLISHED" } })`.
- **Spec**: §4.1 (S3, S4)
- **Parallel**: can be done alongside T-11 and T-12.

### [x] T-11 · Add `tripperBadge` prop to `HeaderHero`
- **File**: `src/components/journey/HeaderHero.tsx`
- **Action**: Add optional prop `tripperBadge?: { name: string; avatarUrl: string }`. When present, render an absolute-positioned overlay (top-right inside the section) showing tripper avatar + "VIAJE CURADO POR [name]" text. When absent, render nothing extra (no behavior change for existing call sites).
- **Spec**: §4.5 (S11)
- **Parallel**: can be done alongside T-10 and T-12.

### [x] T-12 · Add `allowedTypes` and `allowedLevelsByType` props to `JourneyMainContent`
- **File**: `src/components/journey/JourneyMainContent.tsx`
- **Action**: Add optional props `allowedTypes?: string[]` and `allowedLevelsByType?: Record<string, string[]>`. When `allowedTypes` is defined, filter `localizedTravelerTypes` before passing to `BudgetStep`. When undefined, pass full list (current behavior). Thread `allowedLevelsByType` through to `BudgetStep` as a new optional prop.
- **Spec**: §4.3, §4.4 (S8, S9, S10)
- **Sequential**: after T-11 conceptually clean, but no code dependency — can be parallel.

### [x] T-13 · Add filtered level rendering to `BudgetStep`
- **File**: `src/components/journey/BudgetStep.tsx`
- **Action**: Accept new optional prop `allowedLevelsByType?: Record<string, string[]>`. When the user has selected a trip type and this prop is defined, filter the level options to `allowedLevelsByType[selectedType] ?? []`. When undefined, show all levels (current behavior). Render a graceful empty state when the filtered list is empty.
- **Spec**: §4.4 (S10), §4.3 (S9 — empty state)
- **Sequential**: after T-12 interface is agreed (same PR, coordinate props).

### [x] T-14 · Update journey page to fetch tripper context and wire props
- **File**: `src/app/[locale]/journey/page.tsx`
- **Action**: Read `searchParams.tripper` (slug). If present, call `GET /api/trippers/[slug]/journey-context` (client-side fetch or server fetch). Store result in state/props. Pass `tripperBadge` to `HeaderHero`; pass `allowedTypes` and `allowedLevelsByType` to `JourneyMainContent`. If context fetch returns 404 or tripper is null, pass nothing (standard journey behavior).
- **Spec**: §4.3–4.7 (S7–S11)
- **Sequential**: after T-11, T-12, T-13 are complete in same PR.

### [x] T-15 · Pass `tripper` slug in `POST /api/trip-requests` call from journey
- **File**: wherever journey form submission is assembled (likely `JourneyMainContent` or an action/store)
- **Action**: Include `tripper: tripperSlug` in the POST body when a tripper context is active. When no tripper context, omit the field entirely.
- **Spec**: §4.2 (S5, S6)
- **Sequential**: after T-14 (slug must be in scope).

### [x] T-16 · Add tripper branding to trip type cards (curated journey)
- **File**: Wherever trip type cards are rendered inside `BudgetStep` or `JourneyMainContent`
- **Action**: When `allowedTypes` is defined (curated journey), render "BY TRIPPER [NAME]" + avatar on each visible card. When undefined (direct journey), render nothing extra.
- **Spec**: §4.6 (S8)
- **Sequential**: after T-12/T-14 (tripper name/avatar must be in scope).

### [x] T-17 · Add i18n copy keys for curated journey branding
- **Files**: `src/lib/types/dictionary.ts`, `src/dictionaries/es.json`, `src/dictionaries/en.json`
- **Action**: Add keys for the tripper badge label (e.g. `journey.tripperBadge.curatedBy`) and trip card attribution (e.g. `journey.tripperBadge.byTripper`). Update `MarketingDictionary` type accordingly. Run `npm run typecheck`.
- **Spec**: §4.5, §4.6
- **Parallel**: can be done at any point in PR-3, no code dependency on other tasks.

---

## PR-4 — Admin UI

**Branch**: `feat/tel-admin`
**Base**: `feat/tel-ui` (or main after PR-3 merges)
**Spec requirements**: §4.8
**Estimated changed lines**: ~120

### T-18 · Add experience assignment dropdown to `TripRequestModal`
- **File**: `src/components/app/admin/TripRequestModal.tsx`
- **Action**: When `tripRequest.tripperId` is non-null, add an experience selector. On modal open, call `GET /api/admin/experiences?tripperId={tripperId}&level={level}&type={type}&status=ACTIVE`. Populate a `<Select>` with options formatted as `{experience.title} — {experience.destinationCity}, {experience.destinationCountry}`. Bind selected value to form state as `experienceId`.
- **Spec**: §4.8 (S12)
- **Sequential**: after T-07 (API filter must exist).

### T-19 · Hide dropdown and show attribution message when `tripperId` is null
- **File**: `src/components/app/admin/TripRequestModal.tsx`
- **Action**: When `tripRequest.tripperId` is null, render a read-only notice (e.g. "No tripper attributed — experience assignment unavailable") instead of the dropdown. Do not render an empty `<Select>`.
- **Spec**: §4.8 (S13)
- **Sequential**: after T-18 (same component, same PR).

### T-20 · Wire experience assignment save to `PATCH /api/admin/trip-requests/[id]`
- **File**: `src/components/app/admin/TripRequestModal.tsx`
- **Action**: On modal save, include `{ experienceId }` in the PATCH body when the dropdown has a selection. Do NOT include `actualDestination` in the payload — it is derived server-side (T-08). After successful save, refresh the trip request data.
- **Spec**: §4.8 (S14)
- **Sequential**: after T-18, T-19.

### T-21 · Make `actualDestination` field read-only / derived in modal
- **File**: `src/components/app/admin/TripRequestModal.tsx`
- **Action**: If `actualDestination` is currently an editable text input, change it to a read-only display field (or remove the editable version). Add a note that it is derived from the assigned experience at reveal time.
- **Spec**: §4.8 (S14), §5 (invariant)
- **Parallel**: can be done alongside T-18 in the same PR.

---

## Task Execution Order (full DAG)

```
T-01 → T-02 → T-03 ─┐
                      ├→ T-05
T-04 ─────────────────┘
T-02 → T-06
T-02 → T-07
T-02 → T-08
T-02 → T-09

T-10 ─────────────────────────────── (parallel in PR-3)
T-11 ─────────────────────────────── (parallel in PR-3)
T-12 → T-13 → T-14 → T-15 → T-16
T-17 ────────────────────────────── (parallel in PR-3)

T-07 → T-18 → T-19 → T-20
T-21 ─────────────────── (parallel with T-18 in PR-4)
```

---

## Review Workload Forecast

| PR | Tasks | Est. changed lines | 400-line budget risk |
|----|-------|--------------------|----------------------|
| PR-1 (schema) | T-01, T-02 | ~20 | Low |
| PR-2 (API) | T-03–T-09 | ~250 | Low-Medium |
| PR-3 (UI) | T-10–T-17 | ~220 | Low-Medium |
| PR-4 (admin) | T-18–T-21 | ~120 | Low |
| **Total** | 21 tasks | **~610** | **Medium** |

**Chained PRs recommended**: Yes (already chosen — stacked-to-main)
**Decision needed before apply**: No — delivery strategy already set.
**Largest single PR**: PR-2 (API) at ~250 lines; stays under 400-line budget individually.
**Bottleneck**: T-02 (`db push`) gates PR-2 tasks T-06, T-08, T-09. Must merge PR-1 and push schema before branching PR-2 work that writes `tripperId`.
**Parallel opportunity within PR-2**: T-03 and T-04 can be done simultaneously; T-07 independent of T-06; T-09 independent of T-06/T-07.
**Parallel opportunity within PR-3**: T-10, T-11, T-17 are fully independent; T-12→T-13→T-14→T-15→T-16 is the critical path.
