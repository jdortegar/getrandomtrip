# Delta Spec: Traveler Invite — Required Signup Before Submission

**Change**: `traveler-invite-required-signup`
**Supersedes**: `openspec/changes/archive/2026-07-29-invite-travel-friends/spec.md`, Requirement
"Companion Invite Landing — No-Login Submission". That change's spec was never promoted to
`openspec/specs/` (its archive-report skipped Main Spec Sync), so this delta references and
replaces it directly. The MODIFIED block below is the full requirement copied from that archived
spec.md and edited; it is the source of truth pending a future promotion pass.

## Domain: companion-invite

### MODIFIED Requirements

#### Requirement: Companion Invite Landing — Signup Required

(Previously: "No-Login Submission" — anonymous submit allowed; account creation was an optional
link. Now: authentication via `AuthModal` is mandatory before any identity data can be entered.)

`/invite/[token]` MUST render a two-step, session-driven state machine. **Step 1 (no session)**:
only the personalized greeting (buyer first name, neutral pronoun, no destination reveal) and a
"Sign up to continue" CTA opening `AuthModal` (`allowRegister: true`, `defaultMode="register"`)
render — no identity fields, no submit path exists in the DOM. **Step 2 (session present, any
auth state including unverified email)**: collects only `idDocument` + a required consent
checkbox; `name`/`email` MUST NOT be asked. The system MUST NOT gate step 2 on `emailVerified`.

##### Scenario: No-session visitor sees wall only
- GIVEN an unauthenticated visitor opens a valid, unconsumed `/invite/[token]`
- WHEN the page renders
- THEN only the greeting and CTA show; no idDocument/consent form exists

##### Scenario: Register satisfies the wall
- GIVEN the wall CTA opens `AuthModal` in register mode
- WHEN the visitor registers successfully
- THEN the page transitions to step 2 without a reload

##### Scenario: Login satisfies the wall
- GIVEN a companion who already has an account
- WHEN they log in via `AuthModal` from the wall
- THEN the page transitions to step 2 identically to the register path

##### Scenario: Google OAuth round-trip re-enters step 2
- GIVEN the visitor picks Google sign-in with `callbackUrl` set to the current invite URL
- WHEN OAuth completes and the browser returns to `/invite/[token]`
- THEN a session now exists and step 2 renders directly — no cookie or `src/lib/auth.ts` change

##### Scenario: Unverified email still proceeds
- GIVEN a companion just registered and `session.user.emailVerified` is falsy
- WHEN the page evaluates whether to show step 2
- THEN step 2 renders anyway; the page gate does not read `emailVerified`

##### Scenario: Consent still gates submit (unchanged)
- GIVEN step 2 with idDocument filled but consent unchecked
- WHEN the companion attempts to submit
- THEN submission is blocked client- and server-side until consent is checked

##### Scenario: Destination never revealed (unchanged)
- GIVEN any valid, unconsumed token at any step
- WHEN the page renders
- THEN no destination name or reveal-related content appears

**Removed scenario**: "Account creation optional" — unauthenticated submission no longer exists;
superseded by the scenarios above.

### ADDED Requirements

#### Requirement: Token-Gated Unverified-Email Session Bypass

`src/lib/auth.ts`'s credentials `authorize()` MUST continue to throw `EMAIL_NOT_VERIFIED` and issue
no session for any unverified account, UNLESS a live, unconsumed traveler-invite grant accompanies
the login attempt. The grant MUST be carried by a short-lived httpOnly cookie
(`grt_traveler_invite`), minted only by `POST /api/travelers/invite-auth-init` after a server-side
`peekTravelerInvite` confirms the token is valid and unconsumed; the route MUST NOT set the cookie
when the peek fails. `authorize()` MUST evaluate this cookie only inside its existing
`!user.emailVerified` branch and MUST NOT require the invite's target email to match the
authenticating user's email. This exception MUST apply identically regardless of whether the
session originates from a freshly registered account or a pre-existing unverified account, since
both paths call the same `authorize()`. No other login path may read or be affected by this cookie.

##### Scenario: Unverified account with a live invite grant gets a session
- GIVEN an unverified account and a valid, unconsumed traveler-invite token cookie is present
- WHEN credentials `authorize()` runs for that login attempt
- THEN a session is issued and step 2 of `/invite/[token]` unlocks

##### Scenario: Unverified account with no invite grant is unaffected
- GIVEN an unverified account authenticates with no `grt_traveler_invite` cookie present (normal
  login or registration anywhere else in the app)
- WHEN credentials `authorize()` runs
- THEN it throws `EMAIL_NOT_VERIFIED` exactly as before this change, and no session is issued

##### Scenario: Expired, consumed, or invalid grant falls back to the existing throw
- GIVEN an unverified account and a `grt_traveler_invite` cookie present, but the token it resolves
  to is expired, already consumed, or otherwise invalid
- WHEN credentials `authorize()` runs
- THEN the bypass does not apply and it throws `EMAIL_NOT_VERIFIED` exactly as before this change

##### Scenario: Bypass applies identically to register and login branches
- GIVEN a live, unconsumed invite grant cookie is present
- WHEN either the register-then-auto-login branch or the plain login branch of `AuthModal.handleSubmit`
  triggers `signIn("credentials", …)`
- THEN both branches hit the same `authorize()` code path and receive the same session-issued outcome

#### Requirement: Session-Gated Submission Endpoint

`POST /api/travelers/submit` MUST require `getServerSession`; MUST return `401` with none. Payload
narrows to `{ token, idDocument, consent }` — `fullName`/`email` MUST be derived server-side from
`session.user.name`/`session.user.email`, never trusted from the client. On success the endpoint
performs the existing `consumeTravelerInvite` writes (`status → COMPLETE`, `submittedAt`,
`consentAt`) PLUS sets `TripTraveler.userId = session.user.id`. Token expiry, cutoff-lock, and
single-use consumption are UNCHANGED from the archived flow.

##### Scenario: No session rejected
- GIVEN a request with no active session
- WHEN it hits the endpoint
- THEN it returns `401` and no row is modified

##### Scenario: Client-supplied identity ignored
- GIVEN an authenticated session for Alex and a payload with a spoofed `fullName`/`email`
- WHEN submission succeeds
- THEN the persisted row uses `session.user.name`/`session.user.email` and `userId = session.user.id`

##### Scenario: Token semantics unaffected by auth requirement
- GIVEN a token already consumed or past `inviteTokenExpiresAt`
- WHEN an authenticated companion submits against it
- THEN the existing already-submitted/expired error card renders regardless of session state

#### Requirement: Post-Submit Success and Redirect

On success, the page MUST show the existing success copy (`landingSuccessTitle`/
`landingSuccessBody`) for ~1–2s, then navigate to `/{locale}/dashboard`.

##### Scenario: Success then redirect
- GIVEN a successful submission
- WHEN the success card has been visible for ~1–2s
- THEN the browser navigates to `/{locale}/dashboard`

## Domain: companion-travelers

### ADDED Requirements

#### Requirement: TripTraveler Owner Link

`TripTraveler` gains a nullable `userId String?` with a relation to `User`, set ONLY at successful
invite submission. It MUST remain `null` for rows completed via the buyer's direct-fill path and
for all pre-existing `COMPLETE` rows (no backfill).

##### Scenario: userId set on invite submission
- GIVEN a companion completes step 2 authenticated as user U
- WHEN submission succeeds
- THEN `TripTraveler.userId = U.id`

##### Scenario: Minor rows unaffected
- GIVEN a `MINOR` row filled directly by the buyer (minors never traverse `/invite/[token]`)
- WHEN the buyer saves the row
- THEN `TripTraveler.userId` stays `null`

#### Requirement: Companion Trip Access — Shared Predicate

`GET /api/trip-requests` (list) and `GET /api/trips/[id]` (detail) MUST both resolve "can this user
access this trip" through one shared module, `src/lib/travelers/travelerAccess.ts`
(`tripAccessWhere`/`canAccessTrip`), rather than each implementing its own OR-condition. The list
query MUST return the union of trips owned by the requesting user (`TripRequest.userId`) and trips
where a `TripTraveler` row has `userId` matching the requesting user, replacing the prior
buyer-only `where: { userId: user.id }` query. The detail route's `GET` MUST authorize via the same
predicate, replacing its prior buyer-only `trip.userId !== user.id` check. `DELETE
/api/trips/[id]` MUST NOT be widened by this predicate — it MUST remain buyer-only
(`trip.userId === user.id`).

##### Scenario: Companion sees a trip they did not buy in the list
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `GET /api/trip-requests`
- THEN the trip appears in C's list alongside any trips C personally bought

##### Scenario: Companion can open the trip detail page
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `GET /api/trips/[id]` for that trip
- THEN the response is `200` with the full trip detail, at the same permission level as the buyer
  (per the documented v1 parity gap below — no narrowing)

##### Scenario: Companion still cannot delete the trip
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `DELETE /api/trips/[id]` for that trip
- THEN the response is `403 Forbidden`, unchanged from buyer-only deletion — this route is
  intentionally NOT routed through the shared read predicate

##### Scenario: Unrelated user is still forbidden
- GIVEN user X has no `TripRequest.userId` ownership and no `TripTraveler.userId` link to a trip
- WHEN X calls `GET /api/trip-requests` or `GET /api/trips/[id]` for that trip
- THEN the trip is absent from X's list, and the detail call returns `403 Forbidden` — unchanged
  from current behavior

### MODIFIED Requirements

#### Requirement: Edit Rules and Cutoff Enforcement

The cutoff is `TripRequest.startDate − 7 days`. Before cutoff, the buyer MAY edit any row's data
on the success page or dashboard but MUST NOT add or remove rows (count is fixed by paid pax).
At/after cutoff, every row MUST lock: all traveler write endpoints MUST reject edits server-side
regardless of client state, and the UI MUST render disabled inputs, no icon actions, and a lock
banner + support link. **The dashboard trip-detail page (`dashboard/trips/[id]/page.tsx`) MUST
wire the same `rosterRef`/Save-button pattern used on `CheckoutResultSuccess.tsx` so edits on that
surface actually persist.**
(Previously: dashboard edit path was described but never wired to a working Save trigger —
editing any row on `dashboard/trips/[id]/page.tsx` was silently discarded, a currently-shipped
regression.)

##### Scenario: Pre-cutoff edit allowed (unchanged)
- GIVEN today is more than 7 days before `startDate`
- WHEN the buyer edits a traveler row's fields
- THEN the update is accepted and persisted

##### Scenario: Post-cutoff write rejected server-side (unchanged)
- GIVEN today is on or after `startDate − 7 days`
- WHEN a write hits the traveler update endpoint
- THEN the API rejects it regardless of client-side disabled state

##### Scenario: Dashboard Save now persists adult and minor edits
- GIVEN the buyer edits an adult row's idPassport and a minor row's dateOfBirth on
  `dashboard/trips/[id]/page.tsx`
- WHEN the buyer clicks the page's Save button (now wired to `rosterRef.current.saveAll()`)
- THEN both rows persist identically to editing the same fields on the checkout success page

### Documented Out of Scope (Not Silently Omitted)

**Requirement: Companion Permission Parity Is Not Narrowed (v1 Accepted Gap)**

A companion linked via `TripTraveler.userId` receives the SAME `dashboard/trips/[id]` permissions
as the buyer in v1 — the same trip card and detail page render with full buyer-level actions. This
is an accepted risk, not an oversight; permission scoping is deferred to a follow-up change.

##### Scenario: Companion has buyer-level access (documented, not a defect)
- GIVEN a companion linked to a trip via `TripTraveler.userId`
- WHEN they open that trip's detail page
- THEN they see and can act on it exactly as the buyer would, with no permission narrowing
