# tripper-invite Specification

## Change: `tripper-invite`

New capability (no prior invite spec exists). Full spec — not a delta. See `proposal.md` for scope/risk detail.

## Purpose

Defines the admin-initiated, consent-gated Tripper invitation flow: the `TripperInvite` model lifecycle, the two admin trigger endpoints, the public accept flow (existing-user vs. new-user, credentials + OAuth), waitlist cleanup, email localization, and admin UI status rules.

## Requirements

### Requirement: TripperInvite Model and Token Lifecycle

The system MUST persist invites in a `TripperInvite` model: `{id, email, tokenHash, expiresAt, consumedAt, createdAt}`, with no FK to `User` or `WaitlistEntry`. `tokenHash` MUST be the SHA-256 hex digest of a random plaintext token; the plaintext MUST exist only in the emailed link. `expiresAt` MUST be 7 days from issuance. Issuing a new invite for an email with an existing unconsumed, unexpired invite MUST delete that prior row before creating the new one (resend = reissue).

#### Scenario: First invite for an email

- GIVEN no `TripperInvite` row exists for `alice@example.com`
- WHEN an admin triggers an invite for that email
- THEN a `TripperInvite` row is created with `expiresAt` 7 days out, `consumedAt: null`, and only the hash persisted

#### Scenario: Resend invalidates prior pending token

- GIVEN a pending (unexpired, unconsumed) `TripperInvite` for `alice@example.com`
- WHEN an admin re-triggers the invite for the same email
- THEN the prior row is deleted, a new row with a fresh token and `expiresAt` is created, and a new email is sent

#### Scenario: Consumed invite cannot be reissued as-is

- GIVEN a `TripperInvite` with non-null `consumedAt`
- WHEN the admin UI renders that row
- THEN no resend action is available — the row reflects an accepted state, not a pending one

### Requirement: Admin Trigger Endpoints

`POST /api/admin/waitlist/[id]/invite-tripper` and `POST /api/admin/users/[id]/invite-tripper` MUST be gated with `hasRoleAccess(caller, "admin")`, resolve the target email from the waitlist row or user row respectively, then apply the invite issue/resend logic and send `sendTripperInviteEmail`. Waitlist-sourced sends MUST use locale `es`; user-sourced sends MUST use that `User.locale` (falling back to `es` if unset). Neither endpoint MUST modify the target `WaitlistEntry` or `User` row.

#### Scenario: Non-admin caller rejected

- GIVEN a caller without the `admin` role
- WHEN they call either invite-tripper endpoint
- THEN the request is rejected with 403 and no `TripperInvite` row is created

#### Scenario: Waitlist-sourced invite locale

- GIVEN an admin triggers the invite from a Waiting List row
- WHEN the email is sent
- THEN it is sent in `es` regardless of any locale hint

#### Scenario: User-sourced invite locale

- GIVEN an admin triggers the invite from a Users-table row for a user with `locale: "en"`
- WHEN the email is sent
- THEN it is sent in `en`

#### Scenario: Sending an invite does not alter the invitee

- GIVEN a `CLIENT`-only `User` targeted from the Users table
- WHEN the admin sends the invite
- THEN that user's `roles` remain unchanged until they accept

### Requirement: Accept Page Token Resolution

`/[locale]/tripper-invite?token=` and its backing endpoint(s) MUST hash the incoming token and look up `TripperInvite` by `tokenHash`, rejecting if the row is missing, expired, or already consumed. On a valid invite, the system MUST look up `User` by the invite's `email` (not by any session or OAuth-provided identity) to branch behavior.

#### Scenario: Invalid or missing token

- GIVEN a token with no matching `TripperInvite` row
- WHEN the accept page loads
- THEN it renders an error state with no self-service resend option

#### Scenario: Expired token

- GIVEN a `TripperInvite` with `expiresAt` in the past and `consumedAt: null`
- WHEN the accept page loads with that token
- THEN it renders an error state and does not grant any role

#### Scenario: Already-consumed token

- GIVEN a `TripperInvite` with non-null `consumedAt`
- WHEN the accept page loads with that token
- THEN it renders an error state — the token cannot be reused

### Requirement: Accept Flow — Existing User

When the accept flow resolves a valid invite to an existing `User`, the system MUST append `TRIPPER` to that user's `roles` via `addMembershipRole`/`buildUserRoleUpdate` (preserving existing roles), mark the invite `consumedAt`, and redirect to `/` with a message instructing the user to log in.

#### Scenario: Existing CLIENT user accepts

- GIVEN a valid invite for `alice@example.com`, an existing `User` with `roles: ["CLIENT"]`
- WHEN the accept flow runs
- THEN `roles` becomes `["CLIENT", "TRIPPER"]`, the invite is marked consumed, and the response redirects to `/` with a log-in message

#### Scenario: Existing user already TRIPPER

- GIVEN an existing `User` whose `roles` already include `TRIPPER`
- WHEN a valid invite for that email is accepted
- THEN `roles` is unchanged (no duplicate), the invite is marked consumed, and the same redirect occurs

### Requirement: Accept Flow — New User (Credentials or OAuth)

When the accept flow resolves a valid invite to no existing `User`, the accept page MUST render the registration form with the invite email pre-filled and locked, carrying the token through account creation via either credentials or Google OAuth. On successful account creation via either path, the system MUST grant `roles: [CLIENT, TRIPPER]` at creation time, mark the invite `consumedAt`, and delete the matching `WaitlistEntry` (by email) if one exists.

#### Scenario: New user registers via credentials with a valid invite token

- GIVEN a valid, unconsumed invite for `bob@example.com` and no existing `User`
- WHEN `bob@example.com` submits `/api/auth/register` carrying that token
- THEN the created user has `roles: [CLIENT, TRIPPER]`, the invite is marked consumed, and any `WaitlistEntry` for that email is deleted

#### Scenario: New user registers via Google OAuth with a valid invite token

- GIVEN a valid, unconsumed invite for `bob@example.com` and no existing `User`
- WHEN `bob@example.com` completes Google sign-in from the accept flow carrying that token
- THEN the `signIn` callback's new-user `create` branch sets `roles: [CLIENT, TRIPPER]` instead of the default `[CLIENT]`, the invite is marked consumed, and any matching `WaitlistEntry` is deleted

#### Scenario: OAuth email mismatch is not granted

- GIVEN a valid invite for `bob@example.com`
- WHEN a Google OAuth sign-in creates a new user with a different email
- THEN no `TRIPPER` role is granted and the invite remains unconsumed

#### Scenario: Registration without a token is unaffected

- GIVEN a registration request that carries no invite token
- WHEN the account is created
- THEN roles default to `[CLIENT]` exactly as before this change

### Requirement: Waitlist Cleanup on Acceptance

The system MUST delete the `WaitlistEntry` row matching the invite's email only after the corresponding `User` create (or existing-user role grant sourced from a waitlist invite) and invite consumption both succeed, within the same server-side operation.

#### Scenario: Waitlist row removed after new-user acceptance

- GIVEN a `WaitlistEntry` for `carol@example.com` and a waitlist-sourced invite for the same email
- WHEN `carol@example.com` completes registration via the accept flow
- THEN the `WaitlistEntry` row no longer exists and the new `User` has `TRIPPER`

#### Scenario: No waitlist row to clean up

- GIVEN a user-sourced invite (not waitlist-sourced) with no matching `WaitlistEntry`
- WHEN the invite is accepted
- THEN no `WaitlistEntry` deletion is attempted and no error occurs

### Requirement: Invite Email Template and Localization

`sendTripperInviteEmail(email, token, locale)` MUST send via the existing Resend integration using a new `src/emails/TripperInvite.tsx` template with `subjects: {es, en}`, following the `subjects` export pattern used by existing templates. All copy in the template and any related admin/accept-page strings MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json` with matching keys typed in `src/lib/types/dictionary.ts`.

#### Scenario: Email renders in the resolved locale

- GIVEN `sendTripperInviteEmail` is called with `locale: "en"`
- WHEN the email is sent
- THEN both the subject and body render the `en` copy

#### Scenario: Dictionary parity enforced

- GIVEN the new invite/accept/admin copy is added
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

### Requirement: Admin UI Invite Status and Button Gating

Both the Waiting List row and the Users-table row MUST derive an invite status by querying `TripperInvite` for that email: no row → no badge, an unexpired row with `consumedAt: null` → "Invited" badge, an expired row with `consumedAt: null` → "Expired" badge (still resendable). The Users-table invite button MUST NOT render for a user whose `roles` already include `TRIPPER` or `ADMIN`. Once an invite is consumed, the row MUST show an accepted/disabled state with no resend action.

#### Scenario: Pending invite shows Invited badge

- GIVEN a `TripperInvite` for a row's email with `expiresAt` in the future and `consumedAt: null`
- WHEN the admin table renders that row
- THEN it shows an "Invited" badge and the button acts as resend

#### Scenario: Expired invite shows Expired badge

- GIVEN a `TripperInvite` for a row's email with `expiresAt` in the past and `consumedAt: null`
- WHEN the admin table renders that row
- THEN it shows an "Expired" badge and the button still triggers a resend (reissue)

#### Scenario: Button hidden for existing TRIPPER/ADMIN

- GIVEN a `User` row whose `roles` include `TRIPPER`
- WHEN the Users table renders that row
- THEN no invite button is rendered for that row

#### Scenario: Button disabled after acceptance

- GIVEN a `TripperInvite` for a row's email with non-null `consumedAt`
- WHEN the admin table renders that row
- THEN the invite button is disabled/hidden and no badge implies a pending state

## Out of Scope

- Roles other than `TRIPPER`, or an admin role picker.
- Audit trail / admin-action attribution on `TripperInvite`.
- Self-service resend from the accept page.
- A forced Tripper onboarding gate after acceptance.
- Rate limiting on invite/accept endpoints.

## Schema Delta

| Change | Detail |
|--------|--------|
| `TripperInvite` model | ADDED — `{id, email, tokenHash, expiresAt, consumedAt, createdAt}`, no FKs |

## API Contracts

| Endpoint | Auth | Behavior |
|----------|------|----------|
| `POST /api/admin/waitlist/[id]/invite-tripper` | admin (`hasRoleAccess`) | Resolve email from waitlist row; issue/reissue invite; send `es` email |
| `POST /api/admin/users/[id]/invite-tripper` | admin (`hasRoleAccess`) | Resolve email from user row; issue/reissue invite; send email in `User.locale` |
| `/[locale]/tripper-invite?token=` + backing endpoint(s) | public | Resolve invite by token hash; branch existing-user grant vs. new-user registration (credentials/OAuth) |
| `POST /api/auth/register` (modified) | public | Accept+validate optional invite token; grant `roles: [CLIENT, TRIPPER]` at creation when valid |
| `signIn` OAuth callback (modified) | n/a | New-Google-user `create` branch grants `TRIPPER` when a valid pending invite matches the created email |
