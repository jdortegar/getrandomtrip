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

- GIVEN a `TRAVELER`-only `User` targeted from the Users table
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

#### Scenario: Existing TRAVELER user accepts

- GIVEN a valid invite for `alice@example.com`, an existing `User` with `roles: ["TRAVELER"]`
- WHEN the accept flow runs
- THEN `roles` becomes `["TRAVELER", "TRIPPER"]`, the invite is marked consumed, and the response redirects to `/` with a log-in message

#### Scenario: Existing user already TRIPPER

- GIVEN an existing `User` whose `roles` already include `TRIPPER`
- WHEN a valid invite for that email is accepted
- THEN `roles` is unchanged (no duplicate), the invite is marked consumed, and the same redirect occurs

### Requirement: Accept Flow — New User (Credentials or OAuth)

When the accept flow resolves a valid invite to no existing `User`, the accept page MUST render the registration form with the invite email pre-filled and locked, carrying the token through account creation via either credentials or Google OAuth. On successful account creation via either path, the system MUST grant `roles: [TRAVELER, TRIPPER]` at creation time, mark the invite `consumedAt`, and delete the matching `WaitlistEntry` (by email) if one exists.

#### Scenario: New user registers via credentials with a valid invite token

- GIVEN a valid, unconsumed invite for `bob@example.com` and no existing `User`
- WHEN `bob@example.com` submits `/api/auth/register` carrying that token
- THEN the created user has `roles: [TRAVELER, TRIPPER]`, the invite is marked consumed, and any `WaitlistEntry` for that email is deleted

#### Scenario: New user registers via Google OAuth with a valid invite token

- GIVEN a valid, unconsumed invite for `bob@example.com` and no existing `User`
- WHEN `bob@example.com` completes Google sign-in from the accept flow carrying that token
- THEN the `signIn` callback's new-user `create` branch sets `roles: [TRAVELER, TRIPPER]` instead of the default `[TRAVELER]`, the invite is marked consumed, and any matching `WaitlistEntry` is deleted

#### Scenario: OAuth email mismatch is not granted

- GIVEN a valid invite for `bob@example.com`
- WHEN a Google OAuth sign-in creates a new user with a different email
- THEN no `TRIPPER` role is granted and the invite remains unconsumed

#### Scenario: Registration without a token is unaffected

- GIVEN a registration request that carries no invite token
- WHEN the account is created
- THEN roles default to `[TRAVELER]` exactly as before this change

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
| `POST /api/auth/register` (modified) | public | Accept+validate optional invite token; grant `roles: [TRAVELER, TRIPPER]` at creation when valid |
| `signIn` OAuth callback (modified) | n/a | New-Google-user `create` branch grants `TRIPPER` when a valid pending invite matches the created email |

---

# tripper-commission Specification (NEW)

## Purpose

Defines commission as an admin-owned, contract-derived rate on `User.commission` (`Float?`, fraction): who may write it, how it validates, how it defaults when unset, and where it surfaces read-only.

## Requirements

### Requirement: Shared Read-Layer Commission Default

The system MUST derive a tripper's effective commission through one shared helper applying `commission ?? 0.15` at every read site: earnings calculation, tripper profile fetch, tripper settings display, and the admin modal pre-fill. Explicit `0` MUST remain distinguishable from `null` — no site MUST use `|| 0` or any truthiness coercion.

#### Scenario: Unset commission defaults to 15%
- GIVEN a tripper with `commission: null`
- WHEN earnings are calculated or their profile/settings render
- THEN the effective rate used is `0.15`

#### Scenario: Explicit zero is not overridden
- GIVEN a tripper with `commission: 0` (contract negotiated at 0%)
- WHEN earnings are calculated or their profile/settings render
- THEN the effective rate used is `0`, not `0.15`

### Requirement: Admin-Only Commission Write Path

`commission` MUST be writable only via `PATCH /api/admin/users/[id]` by an authenticated ADMIN. `PATCH /api/user/tripper` MUST ignore any `commission` key present in its request body — it MUST NOT read, validate, or persist it.

#### Scenario: Tripper cannot set own commission
- GIVEN an authenticated TRIPPER calls `PATCH /api/user/tripper` with `commission: 10` (fraction meaning 1000%) in the body
- WHEN the request is processed
- THEN the stored `commission` value is unchanged — the submitted value has no effect

#### Scenario: Admin sets commission
- GIVEN an ADMIN submits the Users-table role modal with roles including Tripper and commission `20`
- WHEN `PATCH /api/admin/users/[id]` succeeds
- THEN `User.commission` is persisted as `0.20`

### Requirement: Commission Validation and Atomic Save

`PATCH /api/admin/users/[id]` MUST validate a submitted commission as a whole integer in `0–100` inclusive, both client-side and server-side. The server MUST reject (400) any value outside this range or non-integer — it MUST NOT clamp. If commission and roles are submitted together and commission is invalid, the entire PATCH MUST be rejected with no partial write.

#### Scenario: Invalid commission rejects the whole PATCH
- GIVEN an ADMIN submits roles + commission `150` in one PATCH
- WHEN the server validates the request
- THEN it returns 400 and neither the roles nor the commission change is persisted

#### Scenario: Non-integer commission rejected
- GIVEN an ADMIN submits commission `12.5`
- WHEN the server validates the request
- THEN it returns 400

### Requirement: Onboarding Does Not Require Commission

`PATCH /api/user/tripper` MUST NOT require a commission value to complete tripper onboarding. The existing truthiness guard (`if (!commission || !availableTypes?.length)`) MUST be corrected so commission is no longer part of the required-fields check; the shared `?? 0.15` default at read sites covers a tripper with no assigned rate.

#### Scenario: Onboarding succeeds without a commission value
- GIVEN a user completing tripper onboarding via `PATCH /api/user/tripper` with a valid `availableTypes` list and no `commission` in the body
- WHEN the request is processed
- THEN onboarding succeeds (no 400) and `User.commission` remains `null`

#### Scenario: Onboarding still requires availableTypes
- GIVEN a user submits `PATCH /api/user/tripper` with an empty `availableTypes`
- WHEN the request is processed
- THEN it returns 400, unchanged from prior behavior

### Requirement: Role-Gated, Non-Destructive Field Visibility

The commission input in `UserRoleModal.tsx` MUST render only while the Tripper role checkbox is checked. Unchecking Tripper MUST hide the input but MUST NOT clear or submit a change to the stored `commission` value.

#### Scenario: Unchecking Tripper preserves stored commission
- GIVEN a tripper with `commission: 0.20` is demoted by unchecking Tripper in the modal
- WHEN the PATCH is submitted
- THEN `User.commission` remains `0.20` in the database

#### Scenario: Re-promotion shows prior value
- GIVEN a user previously demoted from Tripper with `commission: 0.20` intact
- WHEN they are re-checked as Tripper in the modal
- THEN the commission input pre-fills with `20`

### Requirement: Read-Only Admin Users Table Column

The admin Users table MUST show a read-only commission column: a whole percent for users with the Tripper role, and an em dash (`—`) for users without it. This column MUST NOT support inline editing.

#### Scenario: Tripper row shows percent
- GIVEN a Tripper with `commission: 0.15`
- WHEN the Users table renders
- THEN the row's commission cell shows `15%`

#### Scenario: Non-tripper row shows em dash
- GIVEN a user without the Tripper role
- WHEN the Users table renders
- THEN the row's commission cell shows `—`

### Requirement: Restored Tripper Settings Commission Section

`TripperSettingsAccountCard.tsx` MUST display the tripper's effective commission (via the shared default helper) as read-only, with an admin-set indicator, replacing the previously removed section that showed unvalidated values.

#### Scenario: Settings show a plausible percent
- GIVEN a tripper with `commission: null`
- WHEN the settings page renders
- THEN the commission section shows `15%`, never a value derived from unvalidated client input

## Cross-Cutting Requirements

### Requirement: Dual-Locale Dictionary Coverage

Every user-visible string introduced by this change (modal label/helper/validation error, table column header, settings copy) MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json`, with matching keys typed in `src/lib/types/dictionary.ts`. No string MUST be hardcoded in components.

#### Scenario: New copy present in both locales
- GIVEN the commission UI (modal, table, settings) renders
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

## Out of Scope

- Prisma migration, DB-level default, or backfill on `User.commission`.
- Audit trail / change history for commission edits.
- Inline editing of commission in the Users table.
- Bulk commission edits, tier-derived rates, or bonus logic.

## API Contracts

| Endpoint | Auth | Commission Behavior |
|----------|------|----------------------|
| `PATCH /api/admin/users/[id]` | ADMIN | Sole write path. Accepts whole-percent integer `0–100`; converts to fraction; atomic 400 on invalid |
| `PATCH /api/user/tripper` | TRIPPER (self) | MUST ignore `commission` in body; MUST NOT require it for onboarding |
| `GET /api/admin/users` | ADMIN | `commission` added to select for table column |
