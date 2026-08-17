# Delta for tripper

## MODIFIED Requirements

### Requirement: TripperInvite Model and Token Lifecycle

The system MUST persist invites in an `AccessInvite` model (renamed from `TripperInvite` via an `ALTER TABLE ... RENAME` migration — no data loss): `{id, email, tokenHash, expiresAt, consumedAt, createdAt, kind}`, with no FK to `User` or `WaitlistEntry`. `kind` MUST be an `AccessInviteKind` enum (`TRIPPER | SITE_ACCESS`) defaulting to `TRIPPER`. `tokenHash` MUST be the SHA-256 hex digest of a random plaintext token; the plaintext MUST exist only in the emailed link. `expiresAt` MUST be 7 days from issuance for both kinds. Issuing a new invite for an email with an existing unconsumed, unexpired invite MUST delete that prior row before creating the new one (resend = reissue), regardless of kind.

(Previously: model was `TripperInvite` with no `kind` field — every invite implicitly meant "grant TRIPPER". Table was `tripper_invites`.)

#### Scenario: First invite for an email

- GIVEN no `AccessInvite` row exists for `alice@example.com`
- WHEN an admin triggers an invite for that email with `kind: TRIPPER`
- THEN an `AccessInvite` row is created with `kind: TRIPPER`, `expiresAt` 7 days out, `consumedAt: null`, and only the hash persisted

#### Scenario: Resend invalidates prior pending token

- GIVEN a pending (unexpired, unconsumed) `AccessInvite` for `alice@example.com`
- WHEN an admin re-triggers an invite for the same email
- THEN the prior row is deleted, a new row with a fresh token and `expiresAt` is created, and a new email is sent

#### Scenario: Consumed invite cannot be reissued as-is

- GIVEN an `AccessInvite` with non-null `consumedAt`
- WHEN the admin UI renders that row
- THEN no resend action is available — the row reflects an accepted state, not a pending one

#### Scenario: Pending tripper_invites rows survive the rename migration

- GIVEN existing `tripper_invites` rows that are unconsumed and unexpired before this change ships
- WHEN the `AccessInvite` rename migration runs
- THEN those rows exist afterward as `AccessInvite` rows with `kind: TRIPPER` (the column default) and still accept as `TRIPPER` invites

### Requirement: Admin Trigger Endpoints

`POST /api/admin/waitlist/[id]/invite` (renamed from `.../invite-tripper`) and `POST /api/admin/users/[id]/invite-tripper` MUST be gated with `hasRoleAccess(caller, "admin")`, resolve the target email from the waitlist row or user row respectively, then apply the invite issue/resend logic and send `sendTripperInviteEmail`. The waitlist endpoint MUST issue the invite with `kind: SITE_ACCESS`; the users-table endpoint MUST issue the invite with `kind: TRIPPER`. Waitlist-sourced sends MUST use locale `es`; user-sourced sends MUST use that `User.locale` (falling back to `es` if unset). Neither endpoint MUST modify the target `WaitlistEntry` or `User` row. The waitlist endpoint MUST NOT check for an existing `User` with the target email before issuing or resending an invite — any existing-`User` guard on this endpoint is removed. The users-table endpoint's separate guard — rejecting with `400` when the target already has `TRIPPER` or `ADMIN` in `roles` — is unaffected by this change and MUST remain in place.

(Previously: both endpoints issued an untyped `TripperInvite` implicitly meaning `TRIPPER`. The waitlist endpoint additionally rejected with `400` when the target email already belonged to an existing `User` of any role — that guard, added by the `waitlist-bulk-actions` change, is removed here.)

#### Scenario: Non-admin caller rejected

- GIVEN a caller without the `admin` role
- WHEN they call either invite endpoint
- THEN the request is rejected with 403 and no `AccessInvite` row is created

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

#### Scenario: Waitlist admin invites an entry

- GIVEN an admin triggers the invite for a Waiting List entry with email `carol@example.com`, who has no existing `User`
- WHEN `POST /api/admin/waitlist/[id]/invite` succeeds
- THEN an `AccessInvite` with `kind: SITE_ACCESS` is created for `carol@example.com`; no role is granted and no `User` row is created until she accepts — she is not promoted to tripper

#### Scenario: Waitlist invite no longer blocked by an existing user

- GIVEN a waitlist entry whose email already matches an existing `User` row (any role)
- WHEN an admin calls `POST /api/admin/waitlist/[id]/invite` for that entry
- THEN the request succeeds (no 400), an `AccessInvite` with `kind: SITE_ACCESS` is issued for that email, and an email is sent

#### Scenario: Users-table promotion still blocks an existing TRIPPER/ADMIN

- GIVEN a target `User` whose `roles` already include `TRIPPER` or `ADMIN`
- WHEN an admin calls `POST /api/admin/users/[id]/invite-tripper` for that user
- THEN the request is rejected with 400 and no `AccessInvite` is created — unchanged from pre-existing behavior

#### Scenario: Users-table promotion issues a TRIPPER-kind invite

- GIVEN an admin triggers the invite from a Users-table row for a `TRAVELER`-only user
- WHEN `POST /api/admin/users/[id]/invite-tripper` succeeds
- THEN an `AccessInvite` with `kind: TRIPPER` is created for that user's email

#### Scenario: SITE_ACCESS invite email does not claim a Tripper role

- GIVEN an admin triggers `POST /api/admin/waitlist/[id]/invite` for a waitlist entry
- WHEN the invite email is sent
- THEN neither the subject nor the body references a Tripper role or Tripper-specific language — the copy is the `SITE_ACCESS`-kind variant of `sendAccessInviteEmail`

### Requirement: Accept Flow — Existing User

When the accept flow resolves a valid invite to an existing `User`, the system MUST set `siteAccessGrantedAt` on that user regardless of `kind`. When `kind: TRIPPER`, it MUST additionally append `TRIPPER` to that user's `roles` via `addMembershipRole`/`buildUserRoleUpdate` (preserving existing roles). In both cases the system MUST mark the invite `consumedAt` and redirect to `/` with a message instructing the user to log in.

(Previously: every accepted invite appended `TRIPPER`, unconditionally; there was no `siteAccessGrantedAt` concept and no kind branch.)

#### Scenario: Existing TRAVELER user accepts a TRIPPER invite

- GIVEN a valid `kind: TRIPPER` invite for `alice@example.com`, an existing `User` with `roles: ["TRAVELER"]`
- WHEN the accept flow runs
- THEN `roles` becomes `["TRAVELER", "TRIPPER"]`, `siteAccessGrantedAt` is set, the invite is marked consumed, and the response redirects to `/` with a log-in message

#### Scenario: Existing user already TRIPPER accepts a TRIPPER invite

- GIVEN an existing `User` whose `roles` already include `TRIPPER`
- WHEN a valid `kind: TRIPPER` invite for that email is accepted
- THEN `roles` is unchanged (no duplicate), `siteAccessGrantedAt` is set, the invite is marked consumed, and the same redirect occurs

#### Scenario: Existing TRAVELER user accepts a SITE_ACCESS invite

- GIVEN a valid `kind: SITE_ACCESS` invite for `dave@example.com`, an existing `User` with `roles: ["TRAVELER"]`
- WHEN the accept flow runs
- THEN `roles` remains `["TRAVELER"]` (no `TRIPPER` granted), `siteAccessGrantedAt` is set, the invite is marked consumed, and the same redirect occurs

### Requirement: Accept Flow — New User (Credentials or OAuth)

When the accept flow resolves a valid invite to no existing `User`, the accept page MUST render the registration form with the invite email pre-filled and locked, carrying the token through account creation via either credentials or Google OAuth. On successful account creation via either path, the system MUST set `siteAccessGrantedAt` at creation time regardless of `kind`. When `kind: TRIPPER`, it MUST additionally grant `roles: [TRAVELER, TRIPPER]` at creation time; otherwise `roles` MUST default to `[TRAVELER]`. In both cases the system MUST mark the invite `consumedAt` and delete the matching `WaitlistEntry` (by email) if one exists.

(Previously: every accepted invite granted `roles: [TRAVELER, TRIPPER]` at creation, unconditionally; there was no `siteAccessGrantedAt` concept and no kind branch.)

#### Scenario: New user registers via credentials with a valid TRIPPER invite token

- GIVEN a valid, unconsumed `kind: TRIPPER` invite for `bob@example.com` and no existing `User`
- WHEN `bob@example.com` submits `/api/auth/register` carrying that token
- THEN the created user has `roles: [TRAVELER, TRIPPER]` and `siteAccessGrantedAt` set, the invite is marked consumed, and any `WaitlistEntry` for that email is deleted

#### Scenario: New user registers via Google OAuth with a valid TRIPPER invite token

- GIVEN a valid, unconsumed `kind: TRIPPER` invite for `bob@example.com` and no existing `User`
- WHEN `bob@example.com` completes Google sign-in from the accept flow carrying that token
- THEN the `signIn` callback's new-user `create` branch sets `roles: [TRAVELER, TRIPPER]` and `siteAccessGrantedAt` instead of the unmodified default (`[TRAVELER]`, no grant), the invite is marked consumed, and any matching `WaitlistEntry` is deleted

#### Scenario: New user registers with a valid SITE_ACCESS invite token (waitlist admin invite)

- GIVEN a valid, unconsumed `kind: SITE_ACCESS` invite for `carol@example.com`, issued from the Waiting List, and no existing `User`
- WHEN `carol@example.com` completes registration (credentials or Google OAuth) carrying that token
- THEN the created user has `roles: [TRAVELER]` only, `siteAccessGrantedAt` is set, the invite is marked consumed, and any matching `WaitlistEntry` is deleted

#### Scenario: OAuth email mismatch is not granted

- GIVEN a valid invite (any `kind`) for `bob@example.com`
- WHEN a Google OAuth sign-in creates a new user with a different email
- THEN no role or `siteAccessGrantedAt` grant is applied and the invite remains unconsumed

#### Scenario: Registration without a token is unaffected

- GIVEN a registration request that carries no invite token
- WHEN the account is created
- THEN `roles` defaults to `[TRAVELER]` and `siteAccessGrantedAt` remains unset, exactly as before this change

## ADDED Requirements

### Requirement: Schema Delivery Sequencing

Because this repository has no Prisma migration history, delivering the `AccessInvite` rename and the new `User.siteAccessGrantedAt` / `AccessInvite.kind` columns MUST follow a fixed two-phase sequence: (1) run the idempotent SQL script `scripts/rename-tripper-invites-to-access-invites.ts` (`npm run db:rename-access-invites`) that performs the enum creation, table+index rename, and column adds via `ALTER TABLE`/`ALTER INDEX`, then (2) run `npm run db:push` as a convergence check. `db:push` MUST NEVER be run with `--accept-data-loss` in this sequence. `npm run db:generate` MUST run only after `db:push` reports a converged schema (no pending destructive operations). No application code referencing `prisma.accessInvite` may run before step (2) completes.

#### Scenario: Skipped Phase 1 causes db:push to refuse the drop

- GIVEN the idempotent rename script has NOT been run against a database that still has the `tripper_invites` table
- WHEN `npm run db:push` is run without `--accept-data-loss`
- THEN Prisma refuses the destructive rename-as-drop-and-create operation and reports it instead of applying it, leaving `tripper_invites` and its rows intact

#### Scenario: Convergence after Phase 1

- GIVEN the idempotent rename script has already run successfully against the target database
- WHEN `npm run db:push` is run
- THEN it reports the schema is already in sync, with no pending operations

### Requirement: Admin Waitlist Invite Availability

The admin Waiting List table's invite action (row button and bulk invite) MUST be available for every waitlist entry regardless of whether the entry's email already matches an existing `User`. The client-side `alreadyMember`-based disabling of the row invite button, the `invitableSelectedIds` filter that excluded `alreadyMember` rows from bulk invite, and the "skipped" note shown after a bulk invite MUST all be removed, consistent with the server-side 400 guard removal in the "Admin Trigger Endpoints" requirement above. This explicitly supersedes the invite-filtering half of the `waitlist-bulk-actions` change's Resolved Decision #1 (client-side gating tied to `alreadyMember`); the other half of that decision — every row's checkbox stays enabled and bulk delete never filters by `alreadyMember` — is unaffected and still holds. The `alreadyMember` status chip itself MUST remain rendered as informational context.

#### Scenario: Row invite button is enabled for an already-member entry

- GIVEN a waitlist entry whose email matches an existing `User` (`alreadyMember: true`)
- WHEN the admin views that row in the Waiting List table
- THEN the row's invite button is enabled (not disabled) and clicking it triggers the invite request

#### Scenario: Bulk invite includes already-member rows in the fan-out

- GIVEN a multi-row selection in the Waiting List table that includes at least one `alreadyMember` entry
- WHEN the admin triggers bulk invite
- THEN every selected row, including the `alreadyMember` one, is included in the invite fan-out and no "skipped" note is shown

### Requirement: Accept Page Copy Selection

The accept-invite client (`TripperInviteClient`) MUST select its displayed copy based on the resolved invite's `kind`. For `kind: SITE_ACCESS`, both accept-page branches — the existing-account login-and-grant branch and the new-account registration branch — MUST render the `tripperInviteAccept.siteAccess` override strings instead of the default Tripper-branch copy. For `kind: TRIPPER`, both branches MUST continue to render the existing default copy, unchanged.

#### Scenario: Existing-account grant renders site-access copy for a SITE_ACCESS invite

- GIVEN a resolved invite with `kind: SITE_ACCESS` and `hasAccount: true`
- WHEN the existing-user grant branch renders
- THEN the displayed copy uses the `siteAccess` override (`grantedTitle`/`grantedBody`), not the default Tripper-branch copy

#### Scenario: New-account registration renders site-access copy for a SITE_ACCESS invite

- GIVEN a resolved invite with `kind: SITE_ACCESS` and `hasAccount: false`
- WHEN the new-user registration branch renders
- THEN the displayed copy uses the `siteAccess` override (`registerEyebrow`/`registerTitle`/`registerSubtitle`/`registerSuccessBody`), not the default Tripper-branch copy

#### Scenario: TRIPPER invite keeps default copy on both branches

- GIVEN a resolved invite with `kind: TRIPPER`
- WHEN either the existing-account grant branch or the new-account registration branch renders
- THEN the displayed copy uses the default (non-`siteAccess`) strings, unchanged from pre-existing behavior
