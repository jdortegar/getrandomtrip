# tripper-profile-visibility Specification

## Change: `tripper-profile-visibility`

New capability. `openspec/specs/tripper/spec.md` currently covers only `tripper-invite` and `tripper-commission` — verified by direct read, no existing `tripper-profile-visibility` section exists. This is a full spec, not a delta. See `proposal.md` for scope/risk detail.

## Purpose

Defines when a Tripper is eligible to be listed, resolvable by URL, and matchable to a new trip/experience, plus the self-service control a Tripper uses to go offline. Two independent gates — persisted `tripperSlug` (onboarding complete) and `isActive` (self-service choice) — combine in every read path so the public directory, profile page, journey flow, and matching all agree on who is reachable.

## Requirements

### Requirement: Listing Completeness Filter

`getAllTrippers()` MUST include `tripperSlug: { not: null }` in its `where` clause, as the single shared source behind the public directory and `/api/trippers`. This filter is independent of any active/inactive state — it exists solely to exclude Trippers who have not yet completed onboarding (no persisted slug).

#### Scenario: Unonboarded tripper excluded from listing
- GIVEN a User with `roles` including `TRIPPER` and `tripperSlug: null`
- WHEN `getAllTrippers()` runs
- THEN that User is absent from the result, regardless of `isActive`

#### Scenario: No synthesized slug in card links
- GIVEN the directory and search-modal card lists render only Trippers with a persisted `tripperSlug`
- WHEN a card link is built
- THEN it MUST use `tripper.tripperSlug` directly with no name-derived fallback synthesis

### Requirement: Listing Active Filter

`getAllTrippers()` MUST additionally include `isActive: true` in the same `where` clause, as a second, independent predicate from the slug-completeness filter in the requirement above. The two conditions MUST both be satisfied for a Tripper to appear; neither substitutes for the other.

#### Scenario: Onboarded but deactivated tripper excluded from listing
- GIVEN a User with a persisted `tripperSlug` and `isActive: false`
- WHEN `getAllTrippers()` runs
- THEN that User is absent from the result

#### Scenario: Onboarded and active tripper included
- GIVEN a User with a persisted `tripperSlug` and `isActive: true`
- WHEN `getAllTrippers()` runs
- THEN that User is present in the result

### Requirement: isActive Field

The system MUST persist `isActive Boolean @default(true)` on `User`. The default MUST be `true` so no existing Tripper disappears from listings on deploy.

#### Scenario: Existing tripper unaffected by migration
- GIVEN a Tripper row created before this change, with no explicit `isActive` value set
- WHEN the migration runs
- THEN `isActive` reads `true` and that Tripper's listing/matching eligibility is unchanged

### Requirement: Profile Lookup Three-Way Outcome

`getTripperBySlug` MUST return a discriminated outcome distinguishing three cases: (1) no User matches the slug, (2) a User matches but `isActive` is `false`, (3) a User matches and `isActive` is `true`. `trippers/[tripper]/page.tsx` MUST render differently per case: case 1 renders `notFound()`; case 2 renders a dedicated "tripper unavailable" state, never a bare 404; case 3 renders the normal profile.

#### Scenario: Slug matches nothing
- GIVEN no User has `tripperSlug` equal to the requested value
- WHEN the profile page loads
- THEN it renders `notFound()` (standard 404)

#### Scenario: Slug matches an inactive tripper
- GIVEN a User with that `tripperSlug` and `isActive: false`
- WHEN the profile page loads
- THEN it renders the "tripper unavailable" state — not `notFound()` — with no data suggesting the profile never existed

#### Scenario: Slug matches an active tripper
- GIVEN a User with that `tripperSlug` and `isActive: true`
- WHEN the profile page loads
- THEN it renders the normal public profile

### Requirement: Journey Flow Unavailable State

When a client's in-progress journey configuration targets a Tripper who is inactive (or becomes inactive mid-configuration), `getTripperJourneyContext` and `JourneyPageClient` MUST render the same "tripper unavailable" state used by the profile page. Silently degrading to a generic/unbranded journey with no message is explicitly prohibited.

#### Scenario: Target tripper inactive mid-configuration
- GIVEN a client is configuring a journey referencing a Tripper whose `isActive` is `false`
- WHEN the journey page loads or refetches context
- THEN it renders the shared "tripper unavailable" state, not a generic fallback with no message

### Requirement: Matching Exclusion at Every User Lookup

Every site that resolves a Tripper by slug/id to attach them to a new TripRequest or surface their Experiences MUST apply `isActive: true` on the **User-lookup** step, not on any subsequent `Experience` query keyed by raw `ownerId`. All listed sites MUST be covered — none may be deferred.

| Site | Lookup | Required Filter |
|---|---|---|
| `POST /api/trip-requests` `?tripper=` resolution | `User.findFirst` by slug → `tripperId` | `isActive: true` |
| `getTripperJourneyContext` | User lookup | `isActive: true` |
| `getTripperFeaturedTrips` | User lookup | `isActive: true` |
| `getTripperExperiencesByTypeAndLevel` | User lookup | `isActive: true` |
| `getTripperAvailableTypesAndLevels` / `tripperHasExperiencesForTypeAndLevel` / `getTripperAvailableTypes` / `getTripperAvailableLevelsForType` (`tripper-trips.ts`) | User lookup | `isActive: true` |
| `GET /api/experiences` | `owner` relation `where` | `owner.isActive: true` |
| `GET /api/admin/experiences` + `TripRequestModal.tsx` query params | `owner` relation `where` | `owner: { isActive: true }` |
| `PATCH /api/admin/trip-requests/[id]` experience-by-`experienceId` lookup | Experience → owner (currently unfiltered) | add `owner.isActive: true` |

#### Scenario: Inactive tripper not resolvable via ?tripper= slug
- GIVEN an inactive Tripper's slug is passed as `?tripper=` on trip-request creation
- WHEN the User-lookup `findFirst` runs
- THEN it returns no match and no `tripperId` is set from that slug

#### Scenario: Inactive tripper's experiences excluded from client search
- GIVEN an inactive Tripper owns published Experiences
- WHEN `GET /api/experiences` runs
- THEN none of that owner's Experiences appear in the response

#### Scenario: Inactive tripper's experiences excluded from admin assignment list
- GIVEN an inactive Tripper owns Experiences
- WHEN `GET /api/admin/experiences` or the `TripRequestModal` query runs
- THEN none of that owner's Experiences appear

#### Scenario: Inactive tripper cannot be attached via direct experienceId assignment
- GIVEN an admin submits an `experienceId` owned by an inactive Tripper to `PATCH /api/admin/trip-requests/[id]`
- WHEN the request is processed
- THEN it is rejected — the owner-active filter added to this lookup blocks the assignment

#### Scenario: Filter placed on Experience query instead of User lookup is a defect
- GIVEN any of the sites above
- WHEN `isActive` is applied only to a raw `Experience.findMany({ ownerId })` query with no join to `User.isActive`
- THEN the exclusion silently does not apply — this placement MUST NOT occur

### Requirement: Self-Service Status Endpoint

`PATCH /api/user/tripper/status` MUST be a new, dedicated route — not an extension of `PATCH /api/user/tripper`. It MUST require an authenticated session, accept only `{ isActive: boolean }`, update only `User.isActive` for the caller's own row, and MUST NOT read, validate, or touch `tripperSlug`, `availableTypes`, or `commission`. It MUST return 400 if the caller's `tripperSlug` is currently `null`.

#### Scenario: Active tripper toggles off
- GIVEN an authenticated Tripper with a persisted `tripperSlug`
- WHEN they `PATCH /api/user/tripper/status` with `{ isActive: false }`
- THEN `User.isActive` becomes `false` and `tripperSlug` is unchanged

#### Scenario: Toggle rejected before onboarding is complete
- GIVEN an authenticated Tripper with `tripperSlug: null`
- WHEN they call `PATCH /api/user/tripper/status` with any `isActive` value
- THEN the request returns 400 and no field is updated

#### Scenario: Unauthenticated caller rejected
- GIVEN no valid session
- WHEN `PATCH /api/user/tripper/status` is called
- THEN the request is rejected and no `isActive` value changes

#### Scenario: Toggle never mutates the slug
- GIVEN an active Tripper with `tripperSlug: "florencia-denis-magyari"`
- WHEN they flip `isActive` via this endpoint, in either direction
- THEN `tripperSlug` after the call is identical to before

### Requirement: Toggle UI Gating

The visibility toggle in `TripperSettingsPublicUrlCard.tsx` MUST reuse the existing `Switch` primitive and MUST be disabled with an explanatory hint whenever the caller's `tripperSlug` is `null`, mirroring the API's 400 guard.

#### Scenario: Toggle disabled before onboarding completes
- GIVEN a Tripper viewing settings with `tripperSlug: null`
- WHEN the settings page renders
- THEN the toggle is disabled and shows a hint explaining why

#### Scenario: Toggle enabled once slug exists
- GIVEN a Tripper with a persisted `tripperSlug`
- WHEN the settings page renders
- THEN the toggle is enabled and reflects the current `isActive` value

### Requirement: Dual-Locale Copy

All new user-visible strings — toggle label, disabled hint, and the shared "tripper unavailable" state copy — MUST exist in both `src/dictionaries/es.json` and `src/dictionaries/en.json`, typed in `src/lib/types/dictionary.ts`.

#### Scenario: Dictionary parity enforced
- GIVEN the new toggle and unavailable-state copy is added
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

## Explicitly Not Required (Non-Goals)

- No admin-side control, override, or display of `isActive` (no users-table column, no badge).
- No change to already-assigned or in-progress TripRequests when a Tripper deactivates — only new assignment is blocked; existing `tripperId`/`experienceId` references are left untouched.
- `src/app/api/internal/destination-reveal/route.ts` is out of scope and MUST remain unmodified by this change.
- No data migration, cancellation, or flagging of existing trips based on `isActive`.
- No admin-driven or scheduled/automatic deactivation, and no vacation-date feature.

## API Contracts

| Endpoint | Auth | Behavior |
|---|---|---|
| `PATCH /api/user/tripper/status` | Session (self) | Body `{ isActive: boolean }` only; 400 if caller's `tripperSlug` is `null`; updates only `isActive` |

## Schema Delta

| Change | Detail |
|---|---|
| `User.isActive` | ADDED — `Boolean @default(true)` |
