# review-commission-attribution Specification

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
