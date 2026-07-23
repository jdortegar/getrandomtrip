# auth-verification-reset Specification

## Change: `auth-verification-reset`

New capability (no prior auth spec exists in this repo). Full spec — not a delta. See `proposal.md` for scope/risk detail.

## Purpose

Defines the email-verification gate for credential login, the token-based self-service password-reset flow, the shared password policy, and the one-time backfill — while leaving Google OAuth login completely unaffected.

## Requirements

### Requirement: Password Policy

Any password accepted at registration or password reset MUST be at least 8 characters, contain at least 1 letter, and at least 1 number. `/api/auth/register` MUST additionally reject an email that does not match a real email-address format.

#### Scenario: Weak password rejected

- GIVEN a password of `"abc123"` (7 chars)
- WHEN submitted to register or reset-password
- THEN the request is rejected with a validation error and no account/hash change occurs

#### Scenario: Invalid email format rejected on register

- GIVEN a register request with email `"not-an-email"`
- WHEN submitted
- THEN the request is rejected before any user row or token is created

### Requirement: Registration Issues Verification Token

On a valid `/api/auth/register` request, the system MUST create the user with `emailVerified: null`, issue an `EMAIL_VERIFY` token (24h expiry, SHA-256 hash persisted, plaintext only in the emailed link), and send the verification email before returning success.

#### Scenario: Successful registration sends verification email

- GIVEN a valid email + policy-compliant password
- WHEN `/api/auth/register` succeeds
- THEN the user is created unverified and a verification email with a `/verify-email?token=` link is dispatched

### Requirement: Email Verification Consumption

`/[locale]/verify-email?token=` and its backing endpoint MUST consume an `EMAIL_VERIFY` token exactly once: validate it is unexpired and unconsumed, set `emailVerified` to the current time, mark it consumed, and show success with a login link.

#### Scenario: Valid token verifies account

- GIVEN an unexpired, unconsumed `EMAIL_VERIFY` token
- WHEN the page/endpoint consumes it
- THEN `emailVerified` is set and the token cannot be reused

#### Scenario: Expired or already-consumed token rejected

- GIVEN a token that is expired or already consumed
- WHEN verification is attempted
- THEN the page shows an error/expired state and `emailVerified` is not changed

### Requirement: Credential Login Verification Gate

`CredentialsProvider.authorize()` MUST reject a credential login when `emailVerified` is null, returning an error distinguishable from "wrong password" so the UI can offer resend. That same blocked attempt MUST auto-issue and send a fresh `EMAIL_VERIFY` token.

#### Scenario: Blocked login triggers resend

- GIVEN a credential account with `emailVerified: null` and correct password
- WHEN login is attempted
- THEN login is rejected with a distinguishable "unverified" error and a new verification email is sent

#### Scenario: Verified account logs in normally

- GIVEN a credential account with non-null `emailVerified` and correct password
- WHEN login is attempted
- THEN login succeeds exactly as before this change

### Requirement: Forgot Password Is Enumeration-Safe

`/api/auth/forgot-password` MUST always return the same generic response regardless of whether the submitted email matches an account. Only when it matches MUST the system issue a `PASSWORD_RESET` token (1h expiry) and send the reset email.

#### Scenario: Existing email issues token silently

- GIVEN an email that matches a credential account
- WHEN forgot-password is called
- THEN the generic response is returned AND a reset email is sent

#### Scenario: Unknown email returns identical response

- GIVEN an email with no matching account
- WHEN forgot-password is called
- THEN the response body/status is identical to the existing-email case AND no email is sent

### Requirement: Password Reset Consumption

`/[locale]/reset-password?token=` and its endpoint MUST validate the `PASSWORD_RESET` token (unexpired, unconsumed) and the new password against the policy, update the bcrypt hash, and consume the token — single use.

#### Scenario: Successful reset

- GIVEN a valid unconsumed token and a policy-compliant new password
- WHEN reset is submitted
- THEN the password hash is updated and the token is marked consumed

#### Scenario: Reused or expired token rejected

- GIVEN a token already consumed or past its 1h expiry
- WHEN reset is submitted
- THEN the request is rejected and the password hash is unchanged

### Requirement: Google OAuth Login Unaffected

The Google OAuth `signIn` callback and login path MUST NOT read or require `emailVerified`. OAuth-authenticated logins MUST succeed regardless of that field's value.

#### Scenario: Google login unaffected by verification state

- GIVEN a Google OAuth account (no `password` set)
- WHEN the user signs in with Google
- THEN login succeeds identically to pre-change behavior, independent of `emailVerified`

### Requirement: Verification Backfill

A one-time, idempotent migration MUST set `emailVerified: null` for every existing user with `password IS NOT NULL`, and a non-null `emailVerified` for every user with `password IS NULL`. It MUST NOT send any email.

#### Scenario: Credential accounts backfilled unverified

- GIVEN a pre-existing credential user
- WHEN the migration runs
- THEN `emailVerified` becomes `null` and no email is sent

#### Scenario: OAuth-only accounts backfilled verified

- GIVEN a pre-existing OAuth-only user (`password IS NULL`)
- WHEN the migration runs
- THEN `emailVerified` becomes non-null and no email is sent

## Out of Scope

- Rate limiting on send/verify/forgot/reset endpoints.
- Session invalidation on password reset (existing sessions persist).
- Gating or touching the Google OAuth `signIn` path.
- Any bulk "please verify" email at migration time.

## Schema Delta

| Change | Detail |
|--------|--------|
| `User.emailVerified` | ADDED — `DateTime?` |
| `VerificationToken` | ADDED — `type: VerificationTokenType`, hashed token, `userId`, `expiresAt`, consumed state |
| `VerificationTokenType` enum | ADDED — `EMAIL_VERIFY \| PASSWORD_RESET` |

## API Contracts

| Endpoint | Behavior |
|----------|----------|
| `POST /api/auth/register` | Validates email format + password policy; creates unverified user; issues+sends `EMAIL_VERIFY` token |
| `POST /api/auth/verify-email` | Consumes `EMAIL_VERIFY` token; sets `emailVerified`; single-use |
| `POST /api/auth/forgot-password` | Always generic response; issues+sends `PASSWORD_RESET` token only on match |
| `POST /api/auth/reset-password` | Validates token + password policy; updates hash; consumes token; single-use |
