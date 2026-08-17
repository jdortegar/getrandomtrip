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

---

# tripper-profile-visibility Specification

## Change: `tripper-profile-visibility`

New capability. Defines when a Tripper is eligible to be listed, resolvable by URL, and matchable to a new trip/experience, plus the self-service control a Tripper uses to go offline. See `proposal.md` for scope/risk detail.

## Purpose

Defines when a Tripper is eligible to be listed, resolvable by URL, and matchable to a new trip/experience, plus the self-service control a Tripper uses to go offline. Two independent gates — persisted `tripperSlug` (onboarding complete) and `isActive` (self-service choice) — combine in every read path so the public directory, profile page, journey flow, and matching all agree on who is reachable.

## Requirements

### Requirement: Listing Completeness Filter

`getAllTrippers()` MUST include `tripperSlug: { not: null }` in its `where` clause, as the single shared source behind the public directory and `/api/trippers`. This filter is independent of any active/inactive state — it exists solely to exclude Trippers who have not yet completed onboarding (no persisted slug).

#### Scenario: Unonboarded tripper excluded from listing
- GIVEN a User with `roles` including `TRIPPER` and `tripperSlug: null`
- WHEN `getAllTrippers()` runs
- THEN that User is absent from the result, regardless of `isActive`

#### Scenario: No synthesized slug in card links
- GIVEN the directory and search-modal card lists render only Trippers with a persisted `tripperSlug`
- WHEN a card link is built
- THEN it MUST use `tripper.tripperSlug` directly with no name-derived fallback synthesis

### Requirement: Listing Active Filter

`getAllTrippers()` MUST additionally include `isActive: true` in the same `where` clause, as a second, independent predicate from the slug-completeness filter in the requirement above. The two conditions MUST both be satisfied for a Tripper to appear; neither substitutes for the other.

#### Scenario: Onboarded but deactivated tripper excluded from listing
- GIVEN a User with a persisted `tripperSlug` and `isActive: false`
- WHEN `getAllTrippers()` runs
- THEN that User is absent from the result

#### Scenario: Onboarded and active tripper included
- GIVEN a User with a persisted `tripperSlug` and `isActive: true`
- WHEN `getAllTrippers()` runs
- THEN that User is present in the result

### Requirement: isActive Field

The system MUST persist `isActive Boolean @default(true)` on `User`. The default MUST be `true` so no existing Tripper disappears from listings on deploy.

#### Scenario: Existing tripper unaffected by migration
- GIVEN a Tripper row created before this change, with no explicit `isActive` value set
- WHEN the migration runs
- THEN `isActive` reads `true` and that Tripper's listing/matching eligibility is unchanged

### Requirement: Profile Lookup Three-Way Outcome

`getTripperBySlug` MUST return a discriminated outcome distinguishing three cases: (1) no User matches the slug, (2) a User matches but `isActive` is `false`, (3) a User matches and `isActive` is `true`. `trippers/[tripper]/page.tsx` MUST render differently per case: case 1 renders `notFound()`; case 2 renders a dedicated "tripper unavailable" state, never a bare 404; case 3 renders the normal profile.

#### Scenario: Slug matches nothing
- GIVEN no User has `tripperSlug` equal to the requested value
- WHEN the profile page loads
- THEN it renders `notFound()` (standard 404)

#### Scenario: Slug matches an inactive tripper
- GIVEN a User with that `tripperSlug` and `isActive: false`
- WHEN the profile page loads
- THEN it renders the "tripper unavailable" state — not `notFound()` — with no data suggesting the profile never existed

#### Scenario: Slug matches an active tripper
- GIVEN a User with that `tripperSlug` and `isActive: true`
- WHEN the profile page loads
- THEN it renders the normal public profile

### Requirement: Journey Flow Unavailable State

When a client's in-progress journey configuration targets a Tripper who is inactive (or becomes inactive mid-configuration), `getTripperJourneyContext` and `JourneyPageClient` MUST render the same "tripper unavailable" state used by the profile page. Silently degrading to a generic/unbranded journey with no message is explicitly prohibited.

#### Scenario: Target tripper inactive mid-configuration
- GIVEN a client is configuring a journey referencing a Tripper whose `isActive` is `false`
- WHEN the journey page loads or refetches context
- THEN it renders the shared "tripper unavailable" state, not a generic fallback with no message

### Requirement: Matching Exclusion at Every User Lookup

Every site that resolves a Tripper by slug/id to attach them to a new TripRequest or surface their Experiences MUST apply `isActive: true` on the **User-lookup** step, not on any subsequent `Experience` query keyed by raw `ownerId`. All listed sites MUST be covered — none may be deferred.

| Site | Lookup | Required Filter |
|---|---|---|
| `POST /api/trip-requests` `?tripper=` resolution | `User.findFirst` by slug → `tripperId` | `isActive: true` |
| `getTripperJourneyContext` | User lookup | `isActive: true` |
| `getTripperFeaturedTrips` | User lookup | `isActive: true` |
| `getTripperExperiencesByTypeAndLevel` | User lookup | `isActive: true` |
| `getTripperAvailableTypesAndLevels` / `tripperHasExperiencesForTypeAndLevel` / `getTripperAvailableTypes` / `getTripperAvailableLevelsForType` (`tripper-trips.ts`) | User lookup | `isActive: true` |
| `GET /api/experiences` | `owner` relation `where` | `owner.isActive: true` |
| `GET /api/admin/experiences` + `TripRequestModal.tsx` query params | `owner` relation `where` | `owner: { isActive: true }` |
| `PATCH /api/admin/trip-requests/[id]` experience-by-`experienceId` lookup | Experience → owner (currently unfiltered) | add `owner.isActive: true` |

#### Scenario: Inactive tripper not resolvable via ?tripper= slug
- GIVEN an inactive Tripper's slug is passed as `?tripper=` on trip-request creation
- WHEN the User-lookup `findFirst` runs
- THEN it returns no match and no `tripperId` is set from that slug

#### Scenario: Inactive tripper's experiences excluded from client search
- GIVEN an inactive Tripper owns published Experiences
- WHEN `GET /api/experiences` runs
- THEN none of that owner's Experiences appear in the response

#### Scenario: Inactive tripper's experiences excluded from admin assignment list
- GIVEN an inactive Tripper owns Experiences
- WHEN `GET /api/admin/experiences` or the `TripRequestModal` query runs
- THEN none of that owner's Experiences appear

#### Scenario: Inactive tripper cannot be attached via direct experienceId assignment
- GIVEN an admin submits an `experienceId` owned by an inactive Tripper to `PATCH /api/admin/trip-requests/[id]`
- WHEN the request is processed
- THEN it is rejected — the owner-active filter added to this lookup blocks the assignment

#### Scenario: Filter placed on Experience query instead of User lookup is a defect
- GIVEN any of the sites above
- WHEN `isActive` is applied only to a raw `Experience.findMany({ ownerId })` query with no join to `User.isActive`
- THEN the exclusion silently does not apply — this placement MUST NOT occur

### Requirement: Self-Service Status Endpoint

`PATCH /api/user/tripper/status` MUST be a new, dedicated route — not an extension of `PATCH /api/user/tripper`. It MUST require an authenticated session, accept only `{ isActive: boolean }`, update only `User.isActive` for the caller's own row, and MUST NOT read, validate, or touch `tripperSlug`, `availableTypes`, or `commission`. It MUST return 400 if the caller's `tripperSlug` is currently `null`.

#### Scenario: Active tripper toggles off
- GIVEN an authenticated Tripper with a persisted `tripperSlug`
- WHEN they `PATCH /api/user/tripper/status` with `{ isActive: false }`
- THEN `User.isActive` becomes `false` and `tripperSlug` is unchanged

#### Scenario: Toggle rejected before onboarding is complete
- GIVEN an authenticated Tripper with `tripperSlug: null`
- WHEN they call `PATCH /api/user/tripper/status` with any `isActive` value
- THEN the request returns 400 and no field is updated

#### Scenario: Unauthenticated caller rejected
- GIVEN no valid session
- WHEN `PATCH /api/user/tripper/status` is called
- THEN the request is rejected and no `isActive` value changes

#### Scenario: Toggle never mutates the slug
- GIVEN an active Tripper with `tripperSlug: "florencia-denis-magyari"`
- WHEN they flip `isActive` via this endpoint, in either direction
- THEN `tripperSlug` after the call is identical to before

### Requirement: Toggle UI Gating

The visibility toggle in `TripperSettingsPublicUrlCard.tsx` MUST reuse the existing `Switch` primitive and MUST be disabled with an explanatory hint whenever the caller's `tripperSlug` is `null`, mirroring the API's 400 guard.

#### Scenario: Toggle disabled before onboarding completes
- GIVEN a Tripper viewing settings with `tripperSlug: null`
- WHEN the settings page renders
- THEN the toggle is disabled and shows a hint explaining why

#### Scenario: Toggle enabled once slug exists
- GIVEN a Tripper with a persisted `tripperSlug`
- WHEN the settings page renders
- THEN the toggle is enabled and reflects the current `isActive` value

### Requirement: Dual-Locale Copy

All new user-visible strings — toggle label, disabled hint, and the shared "tripper unavailable" state copy — MUST exist in both `src/dictionaries/es.json` and `src/dictionaries/en.json`, typed in `src/lib/types/dictionary.ts`.

#### Scenario: Dictionary parity enforced
- GIVEN the new toggle and unavailable-state copy is added
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

## Explicitly Not Required (Non-Goals)

- No admin-side control, override, or display of `isActive` (no users-table column, no badge).
- No change to already-assigned or in-progress TripRequests when a Tripper deactivates — only new assignment is blocked; existing `tripperId`/`experienceId` references are left untouched.
- `src/app/api/internal/destination-reveal/route.ts` is out of scope and MUST remain unmodified by this change.
- No data migration, cancellation, or flagging of existing trips based on `isActive`.
- No admin-driven or scheduled/automatic deactivation, and no vacation-date feature.

## API Contracts

| Endpoint | Auth | Behavior |
|---|---|---|
| `PATCH /api/user/tripper/status` | Session (self) | Body `{ isActive: boolean }` only; 400 if caller's `tripperSlug` is `null`; updates only `isActive` |

## Schema Delta

| Change | Detail |
|---|---|
| `User.isActive` | ADDED — `Boolean @default(true)` |
