# Delta for auth-verification

## ADDED Requirements

### Requirement: Register Captures Validated Referring Tripper
`/api/auth/register` MUST accept an optional `referredByTripperSlug` selection validated against the ACTIVE-tripper list (or explicit "None" -> `null`), write it exactly once at account creation, and apply the self-referral guard and JWT-refresh (`trigger: "update"`) at that same write.

(Previously: registration had no concept of a referring tripper at all — `User.referredByTripperId` did not exist, and there was no way to capture "who referred this traveler" anywhere in the signup flow.)

#### Scenario: Registration writes validated referral once
- GIVEN a register submission selecting tripper "maria" (ACTIVE)
- WHEN the account is created
- THEN `referredByTripperId` is set to maria's id and the session JWT reflects it without requiring re-login

#### Scenario: Inactive tripper in dropdown data is rejected server-side
- GIVEN a submitted `referredByTripperSlug` no longer resolves to an ACTIVE tripper
- WHEN `/api/auth/register` processes it
- THEN the referral is rejected/ignored and the account is created with `referredByTripperId: null`
