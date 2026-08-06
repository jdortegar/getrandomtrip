# trip-request-lifecycle Specification

## Purpose

Guarantee at most one non-terminal (`DRAFT`/`SAVED`/`PENDING_PAYMENT`) `TripRequest` per user per product family (`journey` vs `xsed`), and guarantee `PENDING_PAYMENT` rows never get permanently stuck once their payment window has expired.

## Requirements

### Requirement: Family Classification

The system MUST classify every `TripRequest` into exactly one of two families based on its `type` field: **xsed** family when `type === "xsed"`, **journey** family for every other `type` value (`couple`, `family`, `group`, `solo`, `honeymoon`, `paws`, etc.). This predicate MUST be centralized in a single shared helper — no inline re-implementation elsewhere.

#### Scenario: Journey sub-type switch stays in the journey family
- GIVEN a user's active journey trip has `type: "couple"`
- WHEN they change the sub-type to `type: "solo"` on the same active row
- THEN the row remains classified as `journey` family and is still the single active journey slot

#### Scenario: Xsed and journey are independent slots
- GIVEN a user has one active `journey` trip and one active `xsed` trip
- WHEN either family's finder runs
- THEN each family finder returns only the row belonging to its own family — neither overwrites the other

*(Needs vitest coverage — pure predicate, straightforward unit test.)*

---

### Requirement: Family-Scoped Single-Active-Trip Upsert

`POST /api/trip-requests` MUST NOT create a new row when the authenticated user already has a non-terminal (`DRAFT`, `SAVED`, or `PENDING_PAYMENT`) `TripRequest` in the same family as the incoming request. When such a row exists, the system MUST `update` it in place instead of creating a new one. The system MUST only `create` when no non-terminal row exists for that user+family. A client-supplied `id` in the request body MUST still be honored and updated directly when it resolves to a row owned by the requesting user, but `id` presence/absence MUST NOT be the deciding factor for create-vs-update when no `id` is supplied — the family-scoped finder is authoritative in that case.

(Previously: `POST /api/trip-requests` decided create-vs-update solely on whether the request body carried an `id`; a body without `id` always created a new row regardless of existing non-terminal rows for that user.)

#### Scenario: Repeated journey entry without id updates the same row
- GIVEN a user has an existing `SAVED` journey `TripRequest`
- WHEN they submit `POST /api/trip-requests` with a new journey configuration and no `id`
- THEN the existing row is updated with the new configuration
- AND no second `TripRequest` row is created

#### Scenario: Journey and xsed requests coexist
- GIVEN a user has an active `DRAFT` journey `TripRequest`
- WHEN they submit `POST /api/trip-requests` with `type: "xsed"` and no `id`
- THEN a new `TripRequest` row is created for the `xsed` family
- AND the existing journey row is untouched

#### Scenario: First request for a family creates
- GIVEN a user has no non-terminal `TripRequest` in the `journey` family
- WHEN they submit `POST /api/trip-requests` with a journey configuration and no `id`
- THEN a new row is created

#### Scenario: Client-supplied id still updates directly
- GIVEN a user owns `TripRequest` id `trip_123`
- WHEN they submit `POST /api/trip-requests` with `id: "trip_123"` and partial fields
- THEN `trip_123` is updated directly, without invoking the family finder

#### Scenario: Terminal rows do not block a new active slot
- GIVEN a user's only `journey` `TripRequest` is `CANCELLED`
- WHEN they submit `POST /api/trip-requests` with a journey configuration and no `id`
- THEN a new row is created — the `CANCELLED` row does not count as active

*(Needs vitest coverage — RED/GREEN per strict TDD: family-scoped finder + create/update branch selection, including the terminal-row and cross-family scenarios above.)*

---

### Requirement: Persisted Expiry-Revert of Stale PENDING_PAYMENT

When a `TripRequest` is in `PENDING_PAYMENT` status and its linked `Payment.expiresAt` (via the 1:1 `Payment.tripRequestId` relation) is in the past, the system MUST persist a real `tripRequest.update` reverting `status` to `SAVED` — not `CANCELLED` — at the moment the expiry is detected. This check-and-revert logic MUST live in one shared helper, invoked from exactly two touchpoints: `GET /api/trips` and the payable-status guard in `POST /api/stripe/payment-intent`. No new schema column is introduced; expiry is derived solely from the existing `Payment.expiresAt`.

#### Scenario: GET /api/trips reverts and persists an expired row
- GIVEN a user's `TripRequest` is `PENDING_PAYMENT` with a linked `Payment.expiresAt` in the past
- WHEN the user calls `GET /api/trips`
- THEN the response reflects `status: "SAVED"` for that trip
- AND the `TripRequest` row is persisted as `SAVED` in the database (verifiable on a subsequent independent read)

#### Scenario: payment-intent guard reverts before evaluating payability
- GIVEN a `TripRequest` is `PENDING_PAYMENT` with an expired `Payment.expiresAt`
- WHEN `POST /api/stripe/payment-intent` is called for that trip
- THEN the trip is reverted and persisted to `SAVED` before the payable-status check runs
- AND the request proceeds as a normal `SAVED`-trip checkout (not rejected as non-payable)

#### Scenario: Non-expired PENDING_PAYMENT is left untouched
- GIVEN a `TripRequest` is `PENDING_PAYMENT` with `Payment.expiresAt` still in the future
- WHEN either touchpoint runs
- THEN no update is issued and the trip remains `PENDING_PAYMENT`

#### Scenario: Revert is visible to other readers without their own check
- GIVEN an expired `PENDING_PAYMENT` trip was already reverted via `GET /api/trips`
- WHEN any other reader (e.g. admin dashboard) queries the same `TripRequest` afterward
- THEN it observes `status: "SAVED"` directly, with no additional expiry logic of its own

*(Needs vitest coverage — RED/GREEN per strict TDD: the shared helper's revert decision, and both touchpoints actually invoking it and persisting the write.)*

---

### Requirement: Reused PaymentIntent Amount Revalidation

`POST /api/stripe/payment-intent` MUST NOT reuse an existing unexpired Stripe PaymentIntent (its idempotency short-circuit) without first recomputing the trip's current amount from the trip's present configuration and comparing it to the existing intent's amount. This becomes reachable now that a single-active-trip row can be reconfigured (different destination/dates/addons) while a live `PENDING` `Payment`/`PaymentIntent` still points at the old amount. On a mismatch, the system MUST cancel the stale Stripe PaymentIntent and create a fresh PaymentIntent for the current computed amount, persisting the new `Payment` details in its place. The client MUST NOT receive a `clientSecret` for a PaymentIntent whose amount no longer matches the trip's current computed total.

(Previously: the idempotency check returned the existing `PENDING` intent's `clientSecret` unconditionally whenever one existed and was in a resumable Stripe status, without comparing its amount to the trip's current computed total.)

#### Scenario: Stale intent is cancelled and replaced on amount mismatch
- GIVEN a `TripRequest` is `PENDING_PAYMENT` with an existing unexpired `Payment`/`PaymentIntent` created for amount `A`
- WHEN the trip's configuration has since changed (e.g. different addons) such that the current computed total is `B`, `B != A`
- AND `POST /api/stripe/payment-intent` is called for that trip
- THEN the existing Stripe PaymentIntent is cancelled
- AND a new Stripe PaymentIntent is created for amount `B`
- AND the client receives the new intent's `clientSecret`, never the stale one's

#### Scenario: Matching amount reuses the existing intent unchanged
- GIVEN a `TripRequest` is `PENDING_PAYMENT` with an existing unexpired `Payment`/`PaymentIntent` created for amount `A`
- WHEN the trip's current computed total is still `A`
- AND `POST /api/stripe/payment-intent` is called for that trip
- THEN the existing Stripe PaymentIntent is returned unchanged
- AND no new PaymentIntent is created and no cancellation occurs

*(Needs vitest coverage — RED/GREEN per strict TDD: both the mismatch branch, mocking Stripe cancel + create calls, and the matching-amount branch confirming no side effects.)*

---

### Requirement: Removal of Unused Trips-Creation Endpoint

The `POST` handler in `src/app/api/trips/route.ts` MUST be deleted. The `GET` handler in the same file MUST remain unchanged and continue to function. No other route file or module MUST import or re-export the removed `POST` handler.

(Previously: `POST /api/trips` existed as dead code with an ownership-check gap and references to non-existent Prisma fields; `POST /api/trip-requests` is the actual write path in use.)

#### Scenario: GET /api/trips still works after removal
- GIVEN the `POST` export is removed from `src/app/api/trips/route.ts`
- WHEN a client calls `GET /api/trips`
- THEN it returns the same trip list/pagination behavior as before the change

#### Scenario: No caller depends on the removed handler
- GIVEN the codebase is searched for imports/calls of the removed `POST` handler
- WHEN the search completes
- THEN no route, test, or module references it

*(Needs vitest coverage for the GET-still-works scenario; the "no caller" scenario is verified by repo-wide search at apply time, not a runtime test.)*

---

### Requirement: Historical Duplicate Cleanup Script

A one-off script MUST identify, per `userId` + family, every group of more than one non-terminal (`DRAFT`/`SAVED`/`PENDING_PAYMENT`) `TripRequest` row. For each such group, the script MUST keep the row with the most recent `updatedAt` unchanged and MUST set every other row in the group to `CANCELLED`. The script MUST reuse the same family-classification and non-terminal-status predicates as the runtime enforcement (no duplicated logic). The script MUST NOT alter rows that are already the sole non-terminal row for their user+family, and MUST NOT touch any terminal-status row.

#### Scenario: Duplicate journey rows collapse to one
- GIVEN a user has three non-terminal `journey` rows with `updatedAt` values T1 < T2 < T3
- WHEN the script runs
- THEN the row with `updatedAt = T3` remains unchanged
- AND the rows with `T1` and `T2` are set to `CANCELLED`

#### Scenario: Families are cleaned independently
- GIVEN a user has two non-terminal `journey` rows and two non-terminal `xsed` rows
- WHEN the script runs
- THEN each family independently keeps its newest row and cancels the other, with no cross-family interference

#### Scenario: Single non-terminal row is left untouched
- GIVEN a user has exactly one non-terminal row for a given family
- WHEN the script runs
- THEN that row is not modified

*(Needs vitest coverage — RED/GREEN per strict TDD: the grouping/selection logic. A dry-run mode is expected per the proposal's risk mitigation but is an implementation detail, not spec'd here.)*

---

## Out of Scope

- Any traveler-dashboard UI change (resume-checkout CTA, filtering `CANCELLED`, badges)
- New Prisma column or migration for expiry tracking
- Cron / scheduled function for expiry revert or cleanup
- DB-level unique constraint enforcing the single-active-trip invariant (accepted race risk per proposal decision #6)
- Admin dashboard changes

## Schema Delta

None. No migration in this change (proposal decision #4).
