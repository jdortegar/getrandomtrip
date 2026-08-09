# Delta for tripper

## MODIFIED Requirements

### Requirement: Admin Trigger Endpoints

`POST /api/admin/waitlist/[id]/invite-tripper` and `POST /api/admin/users/[id]/invite-tripper` MUST be gated with `hasRoleAccess(caller, "admin")`, resolve the target email from the waitlist row or user row respectively, then apply the invite issue/resend logic and send `sendTripperInviteEmail`. Waitlist-sourced sends MUST use locale `es`; user-sourced sends MUST use that `User.locale` (falling back to `es` if unset). Neither endpoint MUST modify the target `WaitlistEntry` or `User` row. Before issuing or resending an invite, `POST /api/admin/waitlist/[id]/invite-tripper` MUST check whether any `User` row exists with the target email (any role) and, if so, MUST reject the request with `400` and MUST NOT create or reissue a `TripperInvite` row or send an email. This guard applies uniformly whether the request originates from the single-row invite button or from the bulk-invite fan-out defined in the `admin-waitlist-management` capability.

(Previously: no existing-`User` guard existed on the waitlist invite-tripper endpoint — any email could be invited even if it already resolved to an account.)

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

#### Scenario: Waitlist invite blocked for an existing user

- GIVEN a waitlist entry with email `dana@example.com` and an existing `User` row with that same email (any role)
- WHEN an admin calls `POST /api/admin/waitlist/[id]/invite-tripper` for that entry, directly or via bulk fan-out
- THEN the request returns `400`, no `TripperInvite` row is created or reissued, and no email is sent

#### Scenario: Guard does not apply to the Users-table endpoint

- GIVEN a `User` row targeted from the Users table
- WHEN an admin calls `POST /api/admin/users/[id]/invite-tripper` for that user
- THEN the existing-user guard does not apply — this endpoint always targets an existing user by design

### Requirement: Admin UI Invite Status and Button Gating

Both the Waiting List row and the Users-table row MUST derive an invite status by querying `TripperInvite` for that email: no row → no badge, an unexpired row with `consumedAt: null` → "Invited" badge, an expired row with `consumedAt: null` → "Expired" badge (still resendable). The Users-table invite button MUST NOT render for a user whose `roles` already include `TRIPPER` or `ADMIN`. Once an invite is consumed, the row MUST show an accepted/disabled state with no resend action. Independently of the `TripperInvite`-derived status, the Waiting List row MUST also check `alreadyMember` (derived from `User` existence for that email, any role — see `admin-waitlist-management`): when `true`, the row MUST render an "Already a member" badge and disable the single-row invite button, and the row MUST be excluded client-side from bulk invite. This "Already a member" condition is keyed on `User` existence, distinct from the `TripperInvite`-derived Invited/Expired condition; the two MAY both be true for the same row, in which case "Already a member" takes visual and behavioral precedence over the Invited/Expired badge and the invite action remains disabled.

(Previously: only the Users-table invite-button hide-for-TRIPPER/ADMIN rule and the shared Invited/Expired badge derivation were specified; no Waiting-List-specific "Already a member" behavior existed.)

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

#### Scenario: Already a member takes precedence on the Waiting List

- GIVEN a waitlist row whose email is `alreadyMember: true`
- WHEN the Waiting List page renders that row
- THEN it shows an "Already a member" badge, the invite button is disabled, and the row is not offered by bulk invite, regardless of any `TripperInvite`-derived status for the same email

#### Scenario: Already a member and a pending invite can coexist

- GIVEN a waitlist row whose email resolves to both `alreadyMember: true` and an unexpired, unconsumed `TripperInvite`
- WHEN the row renders
- THEN only the "Already a member" badge and disabled state are shown — the Invited badge is not displayed for that row
