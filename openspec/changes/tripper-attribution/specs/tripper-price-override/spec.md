# Delta for tripper-price-override

## ADDED Requirements

### Requirement: Attribution Re-Validation Feeds the Existing Resolver
Every price-affecting read/charge site MUST source the `overrides` argument to `resolveBasePricePerPerson` from attribution that has passed read-time liveness re-validation (see the `tripper-attribution` capability), not directly from an unvalidated cookie/JWT value. `resolveBasePricePerPerson` itself is unchanged.

(Previously: overrides only ever reached `resolveBasePricePerPerson` from a `TripRequest.tripperId` resolved once at trip-request creation, or from the `/journey` page's client-side `?tripper=` fetch. There was no session-persisted, cross-navigation source of attribution feeding this resolver at all — the journey level-selection cards and the journey summary sidebar could show catalog prices even when `?tripper=` was present, because those code paths never received an `overrides` argument.)

#### Scenario: Stale attribution never reaches the resolver unvalidated
- GIVEN a cookie points to a since-deactivated tripper
- WHEN a checkout price is computed
- THEN the overrides passed to `resolveBasePricePerPerson` reflect "no attribution" (global catalog), not the stale tripper's overrides
