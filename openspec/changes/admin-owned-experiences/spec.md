# Delta Spec: admin-owned-experiences

## Change: `admin-owned-experiences`

Modifies the `experience-approval-flow` capability (base: `openspec/specs/experience/spec.md`) and adds a new `review-commission-attribution` capability that formalizes previously-unspecced behavior in `src/app/api/reviews/route.ts`. See `proposal.md` for the 11 locked design decisions this spec translates into requirements.

---

# experience-approval-flow Specification (MODIFIED)

## ADDED Requirements

### Requirement: Experience Ownership Source

The `Experience` model MUST carry a `source: ExperienceSource` field with values `TRIPPER | RANDOMTRIP`, distinct from the `type: String[]` travel-category array. `source` MUST default to `TRIPPER`. `source` MUST be derived exclusively from the authenticated caller's role at creation time — it MUST NOT be read from, or settable via, the request body. Once set at creation, `source` is immutable for the lifetime of the record (no update path changes it).

#### Scenario: Source derived from admin caller

- GIVEN an authenticated ADMIN calls the experience creation endpoint
- WHEN the row is created
- THEN `source` is persisted as `RANDOMTRIP` regardless of any `source` value present in the request body

#### Scenario: Source derived from tripper caller

- GIVEN an authenticated TRIPPER calls the experience creation endpoint
- WHEN the row is created
- THEN `source` is persisted as `TRIPPER`

#### Scenario: Client-sent source is ignored

- GIVEN a request body containing `source: "RANDOMTRIP"` sent by a TRIPPER-role caller
- WHEN the experience is created
- THEN the persisted `source` is `TRIPPER` — the client-sent value has no effect

---

### Requirement: Role-Aware Experience Creation Endpoint

`POST /api/tripper/experiences` MUST accept calls from both TRIPPER and ADMIN roles (no separate admin endpoint). For an ADMIN caller, the created experience MUST be persisted with `status: ACTIVE` directly (skipping `PENDING_REVIEW`) and MUST NOT include a commission value. For a TRIPPER caller, existing behavior MUST be unchanged: `status: DRAFT`, entering the standard `DRAFT → PENDING_REVIEW → ACTIVE` pipeline, with the commission field shown/required in the creation UI.

#### Scenario: Admin creation auto-publishes

- GIVEN an authenticated ADMIN submits the New Experience form
- WHEN the creation request succeeds
- THEN the experience is persisted with `status: ACTIVE` and `source: RANDOMTRIP`
- AND it never passes through `PENDING_REVIEW`

#### Scenario: Tripper creation flow unaffected

- GIVEN an authenticated TRIPPER submits the New Experience form
- WHEN the creation request succeeds
- THEN the experience is persisted with `status: DRAFT` and `source: TRIPPER`, identical to pre-change behavior

#### Scenario: Commission omitted for admin-created rows

- GIVEN an ADMIN is creating a generic experience
- WHEN the New Experience form renders for that caller
- THEN no commission field/value is shown or submitted, and the server MUST NOT persist a commission value tied to that experience

---

### Requirement: XSED Ownership Backfill

A one-time, idempotent migration MUST set `source: RANDOMTRIP` on every existing `Experience` row where `'XSED' = ANY(type)`, without altering the `type` array or any other field on those rows.

#### Scenario: Existing XSED drops backfilled

- GIVEN an XSED experience created before this change, with `type: ["XSED"]` and no `source` value
- WHEN the migration runs
- THEN the row has `source: RANDOMTRIP` and `type: ["XSED"]` unchanged

#### Scenario: Non-XSED rows unaffected

- GIVEN a tripper-owned experience with `type: ["couple"]`
- WHEN the migration runs
- THEN its `source` remains `TRIPPER` (the column default)

---

## MODIFIED Requirements

### Requirement: Status State Machine (Extended)

The system MUST enforce the following lifecycle for Experience records:

- `DRAFT` → `PENDING_REVIEW` (tripper submits; INACTIVE copy cleaned up if present)
- `DRAFT` → `ACTIVE` (admin/RandomTrip creation auto-publish; `source: RANDOMTRIP` only)
- `PENDING_REVIEW` → `ACTIVE` (admin approves directly, no copy)
- `PENDING_REVIEW` → `DRAFT` (admin rejects directly)
- `PENDING_REVIEW` → `PENDING_TRIPPER_REVIEW` (admin edits + sends copy to tripper)
- `PENDING_TRIPPER_REVIEW` → `ACTIVE` (tripper approves copy)
- `PENDING_TRIPPER_REVIEW` → `DRAFT` (tripper rejects copy)
- `ACTIVE` → `DRAFT` (tripper edits; reverts to draft, loses ACTIVE)

No other direct transitions are permitted. The `DRAFT → ACTIVE` transition MUST only occur for rows created with `source: RANDOMTRIP`; it MUST NOT be reachable for `source: TRIPPER` rows.

(Previously: no `DRAFT → ACTIVE` transition existed; every creation path went through `PENDING_REVIEW`.)

#### Scenario: Happy path — submit → approve (no copy)

- GIVEN an experience in `DRAFT` with all required fields complete
- WHEN a tripper submits for review
- THEN status becomes `PENDING_REVIEW`
- AND the experience is read-only for the tripper until admin acts

#### Scenario: Admin approves directly — no copy path

- GIVEN an experience in `PENDING_REVIEW` with no review copy
- WHEN an admin approves with valid `pricingByType`
- THEN status becomes `ACTIVE`
- AND `pricingByType` is persisted on the record

#### Scenario: Admin approves — copy exists path

- GIVEN an experience in `PENDING_REVIEW` with an existing review copy
- WHEN an admin approves
- THEN the copy data overwrites the original atomically and the copy is hard-deleted
- AND status becomes `ACTIVE`

#### Scenario: Rejection returns to DRAFT

- GIVEN an experience in `PENDING_REVIEW`
- WHEN an admin rejects with a non-empty `reviewNote`
- THEN status becomes `DRAFT`
- AND `reviewNote` is persisted on the record

#### Scenario: Invalid transition rejected

- GIVEN an experience in `ACTIVE` status
- WHEN a request attempts to set status directly to `PENDING_REVIEW` without going through `DRAFT`
- THEN the API MUST return a 422 error

#### Scenario: Admin/RandomTrip creation skips PENDING_REVIEW

- GIVEN an ADMIN caller creates a new generic experience
- WHEN the creation request succeeds
- THEN the record transitions directly from creation to `ACTIVE`, never occupying `DRAFT` or `PENDING_REVIEW`

#### Scenario: Tripper-created rows cannot reach ACTIVE directly

- GIVEN a TRIPPER caller creates a new experience (`source: TRIPPER`)
- WHEN the creation request succeeds
- THEN the record is `DRAFT` and MUST go through `PENDING_REVIEW` before it can become `ACTIVE`

---

## Cross-Cutting Requirements

### Requirement: Dual-Locale Dictionary Coverage (New Admin UI)

Every user-visible string introduced by the admin "New Experience" tab (tab label, form-difference copy, e.g. hidden-commission messaging) MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json`, with matching keys typed in `src/lib/types/dictionary.ts`. No string MUST be hardcoded in the tab or form components.

#### Scenario: New admin copy present in both locales

- GIVEN the admin "New Experience" tab renders
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

---

## Out of Scope

- **Booking/consumption matching**: `PATCH /api/admin/trip-requests/[id]` already assigns `experienceId` via an unfiltered `findUnique` (no owner/status/type filter). `RANDOMTRIP`-sourced experiences are already assignable there with zero code change — confirmed by investigation during proposal. This spec does not add or require any filtering logic here.
- Changing the tripper approval pipeline or XSED creation flow.
- Making `source` user-selectable at any point after creation.

---

## Schema Delta

| Change | Detail |
|--------|--------|
| `ExperienceSource` enum | ADDED — values `TRIPPER \| RANDOMTRIP` |
| `Experience.source` | ADDED as `ExperienceSource @default(TRIPPER)` |

## API Contracts (Updated)

| Endpoint | Auth | Behavior by Role |
|----------|------|-------------------|
| `POST /api/tripper/experiences` | TRIPPER or ADMIN | TRIPPER → `status: DRAFT`, `source: TRIPPER`, commission required. ADMIN → `status: ACTIVE`, `source: RANDOMTRIP`, commission omitted |

---

# review-commission-attribution Specification (NEW)

## Purpose

Defines how `POST /api/reviews` derives the `effectiveTripperId` used for commission-relevant review attribution when `TripRequest.tripperId` is null, replacing the mutable `owner.roles` check with the immutable `Experience.source` field.

## Requirements

### Requirement: Attribution via Experience Source

When a `TripRequest.tripperId` is null, the system MUST derive `effectiveTripperId` from the linked `Experience.source` field: if `source === "TRIPPER"`, `effectiveTripperId` MUST be set to `experience.ownerId`; if `source === "RANDOMTRIP"`, `effectiveTripperId` MUST remain `null`. The system MUST NOT read `owner.roles` for this determination.

#### Scenario: Tripper-sourced experience attributes owner

- GIVEN a `TripRequest` with `tripperId: null` linked to an `Experience` with `source: "TRIPPER"` and `ownerId: "t1"`
- WHEN a review is submitted via `POST /api/reviews`
- THEN the created `Review.tripperId` is `"t1"`

#### Scenario: RandomTrip-sourced experience attributes no tripper

- GIVEN a `TripRequest` with `tripperId: null` linked to an `Experience` with `source: "RANDOMTRIP"`
- WHEN a review is submitted via `POST /api/reviews`
- THEN the created `Review.tripperId` is `null`, even if the experience's `owner.roles` happens to include `"TRIPPER"`

#### Scenario: Existing tripperId path unaffected

- GIVEN a `TripRequest` with a non-null `tripperId`
- WHEN a review is submitted
- THEN `effectiveTripperId` uses the existing `TripRequest.tripperId` value directly — the `Experience.source` check is not consulted
