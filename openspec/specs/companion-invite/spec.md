# Spec: Companion Invite — Required Signup Before Submission

## Change Context

This spec supersedes the prior "No-Login Submission" requirement from `openspec/changes/archive/2026-07-29-invite-travel-friends/spec.md` (archived spec never promoted to main), consolidating the final authoritative companion-invite capability definition.

**Changed by**: `traveler-invite-required-signup` (status: completed, all 32 tasks green); amended by `companion-invite-auto-send` (phase 1: accept until trip end, invited-email match, auto-send on save, rewritten email, backfill script).

---

## Domain: companion-invite

### Requirement: Companion Invite Landing — Signup Required

(Previously: "No-Login Submission" — anonymous submit allowed; account creation was an optional link. Now: authentication via `AuthModal` is mandatory before any identity data can be entered.)

`/invite/[token]` MUST render a two-step, session-driven state machine. **Step 1 (no session)**: only the personalized greeting (buyer first name, neutral pronoun, no destination reveal) and a "Sign up to continue" CTA opening `AuthModal` (`allowRegister: true`, `defaultMode="register"`, with the invited email prefilled and read-only via `initialEmail` + `lockEmail`) render — no identity fields, no submit path exists in the DOM. **Step 2 (session present, any auth state including unverified email)**: collects only `idDocument` + a required consent checkbox; a populated, protected ID after cutoff is not asked again. `name`/`email` MUST NOT be asked. The system MUST NOT gate step 2 on `emailVerified`.

#### Scenario: No-session visitor sees wall only
- GIVEN an unauthenticated visitor opens a valid, unconsumed `/invite/[token]`
- WHEN the page renders
- THEN only the greeting and CTA show; no idDocument/consent form exists

#### Scenario: Register satisfies the wall
- GIVEN the wall CTA opens `AuthModal` in register mode
- WHEN the visitor registers successfully
- THEN the page transitions to step 2 without a reload

#### Scenario: Login satisfies the wall
- GIVEN a companion who already has an account
- WHEN they log in via `AuthModal` from the wall
- THEN the page transitions to step 2 identically to the register path

#### Scenario: Google OAuth round-trip re-enters step 2
- GIVEN the visitor picks Google sign-in with `callbackUrl` set to the current invite URL
- WHEN OAuth completes and the browser returns to `/invite/[token]`
- THEN a session now exists and step 2 renders directly — no cookie or `src/lib/auth.ts` change

#### Scenario: Unverified email still proceeds
- GIVEN a companion just registered and `session.user.emailVerified` is falsy
- WHEN the page evaluates whether to show step 2
- THEN step 2 renders anyway; the page gate does not read `emailVerified`

#### Scenario: Signed-in account with a different email is blocked
- GIVEN a session whose email differs (case-insensitive, trimmed) from the invited email
- WHEN the page renders step 2
- THEN no form renders; a localized message shows "This invite was sent to {masked}. Sign in with that email." (masked form `j***@gmail.com`, never the raw address) with a "use a different account" action that signs out

#### Scenario: Consent still gates submit (unchanged)
- GIVEN step 2 with idDocument filled but consent unchecked
- WHEN the companion attempts to submit
- THEN submission is blocked client- and server-side until consent is checked

#### Scenario: Destination never revealed (unchanged)
- GIVEN any valid, unconsumed token at any step
- WHEN the page renders
- THEN no destination name or reveal-related content appears

### Requirement: Token-Gated Unverified-Email Session Bypass

`src/lib/auth.ts`'s credentials `authorize()` MUST continue to throw `EMAIL_NOT_VERIFIED` and issue no session for any unverified account, UNLESS a live, unconsumed traveler-invite grant accompanies the login attempt. The grant MUST be carried by a short-lived httpOnly cookie (`grt_traveler_invite`), minted only by `POST /api/travelers/invite-auth-init` after a server-side `peekTravelerInvite` confirms the token is valid and unconsumed; the route MUST NOT set the cookie when the peek fails. `authorize()` MUST evaluate this cookie only inside its existing `!user.emailVerified` branch and MUST NOT require the invite's target email to match the authenticating user's email. This exception MUST apply identically regardless of whether the session originates from a freshly registered account or a pre-existing unverified account, since both paths call the same `authorize()`. No other login path may read or be affected by this cookie.

#### Scenario: Unverified account with a live invite grant gets a session
- GIVEN an unverified account and a valid, unconsumed traveler-invite token cookie is present
- WHEN credentials `authorize()` runs for that login attempt
- THEN a session is issued and step 2 of `/invite/[token]` unlocks

#### Scenario: Unverified account with no invite grant is unaffected
- GIVEN an unverified account authenticates with no `grt_traveler_invite` cookie present (normal login or registration anywhere else in the app)
- WHEN credentials `authorize()` runs
- THEN it throws `EMAIL_NOT_VERIFIED` exactly as before this change, and no session is issued

#### Scenario: Expired, consumed, or invalid grant falls back to the existing throw
- GIVEN an unverified account and a `grt_traveler_invite` cookie present, but the token it resolves to is expired, already consumed, or otherwise invalid
- WHEN credentials `authorize()` runs
- THEN the bypass does not apply and it throws `EMAIL_NOT_VERIFIED` exactly as before this change

#### Scenario: Bypass applies identically to register and login branches
- GIVEN a live, unconsumed invite grant cookie is present
- WHEN either the register-then-auto-login branch or the plain login branch of `AuthModal.handleSubmit` triggers `signIn("credentials", …)`
- THEN both branches hit the same `authorize()` code path and receive the same session-issued outcome

### Requirement: Session-Gated Submission Endpoint

`POST /api/travelers/submit` MUST require `getServerSession`; MUST return `401` with none. Payload narrows to `{ token, idDocument, consent }` — `fullName`/`email` MUST be derived server-side from `session.user.name`/`session.user.email`, never trusted from the client. On success the endpoint performs the existing `consumeTravelerInvite` writes (`status → COMPLETE`, `submittedAt`, `consentAt`) PLUS sets `TripTraveler.userId = session.user.id`. Token expiry and single-use consumption are unchanged. Cutoff protection follows the field-level policy below; populated identity and account ownership must not be overwritten after cutoff. The endpoint MUST reject with `403` and error `email_mismatch` when the normalized (trim + lowercase) session email differs from the normalized `TripTraveler.email`, or when the row has no email; the check runs inside `consumeTravelerInvite` and writes nothing.

#### Scenario: No session rejected
- GIVEN a request with no active session
- WHEN it hits the endpoint
- THEN it returns `401` and no row is modified

#### Scenario: Client-supplied identity ignored
- GIVEN an authenticated session for Alex and a payload with a spoofed `fullName`/`email`
- WHEN submission succeeds
- THEN new identity values come from `session.user.name`/`session.user.email` and `userId = session.user.id`; at/after cutoff, already populated identity and an existing account link are preserved

#### Scenario: Email mismatch rejected
- GIVEN a valid token for a row invited as `jane@example.com` and a session for `other@example.com`
- WHEN the account submits
- THEN the response is `403 { error: "email_mismatch" }` and the row is unchanged

#### Scenario: Email match is case- and whitespace-insensitive
- GIVEN a row invited as `jane@example.com` and a session email `Jane@Example.com`
- WHEN the account submits
- THEN the claim succeeds

#### Scenario: Token semantics unaffected by auth requirement
- GIVEN a token already consumed or past `inviteTokenExpiresAt`
- WHEN an authenticated companion submits against it
- THEN the existing already-submitted/expired error card renders regardless of session state

### Requirement: Post-Submit Success and Redirect

On success, the page MUST show the existing success copy (`landingSuccessTitle`/`landingSuccessBody`) for ~1–2s, then navigate to `/{locale}/dashboard`.

#### Scenario: Success then redirect
- GIVEN a successful submission
- WHEN the success card has been visible for ~1–2s
- THEN the browser navigates to `/{locale}/dashboard`

---

## Domain: companion-travelers

### Requirement: TripTraveler Owner Link

`TripTraveler` gains a nullable `userId String?` with a relation to `User`, set ONLY at successful invite submission. It MUST remain `null` for rows completed via the buyer's direct-fill path and for all pre-existing `COMPLETE` rows (no backfill).

#### Scenario: userId set on invite submission
- GIVEN a companion completes step 2 authenticated as user U
- WHEN submission succeeds
- THEN `TripTraveler.userId = U.id`

#### Scenario: Minor rows unaffected
- GIVEN a `MINOR` row filled directly by the buyer (minors never traverse `/invite/[token]`)
- WHEN the buyer saves the row
- THEN `TripTraveler.userId` stays `null`

### Requirement: Companion Trip Access — Shared Predicate

`GET /api/trip-requests` (list) and `GET /api/trips/[id]` (detail) MUST both resolve "can this user access this trip" through one shared module, `src/lib/travelers/travelerAccess.ts` (`tripAccessWhere`/`canAccessTrip`), rather than each implementing its own OR-condition. The list query MUST return the union of trips owned by the requesting user (`TripRequest.userId`) and trips where a `TripTraveler` row has `userId` matching the requesting user, replacing the prior buyer-only `where: { userId: user.id }` query. The detail route's `GET` MUST authorize via the same predicate, replacing its prior buyer-only `trip.userId !== user.id` check. `DELETE /api/trips/[id]` MUST NOT be widened by this predicate — it MUST remain buyer-only (`trip.userId === user.id`).

#### Scenario: Companion sees a trip they did not buy in the list
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `GET /api/trip-requests`
- THEN the trip appears in C's list alongside any trips C personally bought

#### Scenario: Companion can open the trip detail page
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `GET /api/trips/[id]` for that trip
- THEN the response is `200` with the full trip detail, at the same permission level as the buyer (per the documented v1 parity gap below — no narrowing)

#### Scenario: Companion still cannot delete the trip
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `DELETE /api/trips/[id]` for that trip
- THEN the response is `403 Forbidden`, unchanged from buyer-only deletion — this route is intentionally NOT routed through the shared read predicate

#### Scenario: Unrelated user is still forbidden
- GIVEN user X has no `TripRequest.userId` ownership and no `TripTraveler.userId` link to a trip
- WHEN X calls `GET /api/trip-requests` or `GET /api/trips/[id]` for that trip
- THEN the trip is absent from X's list, and the detail call returns `403 Forbidden` — unchanged from current behavior

### Requirement: Edit Rules and Cutoff Enforcement

The cutoff is `TripRequest.startDate − 72 elapsed hours` for XSED and `startDate − 7 days` for other trips. Before cutoff, authorized travelers MAY edit any row's data on either surface, but MUST NOT add/remove rows. XSED's legacy T-7d `travelersLockedAt` stamps MUST NOT override the new cutoff.

At/after cutoff, populated fields MUST be protected server-side and in the UI. Empty, null, and whitespace-only required fields MUST remain fillable, including invited adult IDs and minor details. Save actions MUST remain available on both checkout success and trip detail when any required detail is missing. Unlinked adult rows with an email MAY be invited or re-invited at any time until the trip ends (`POST /api/travelers/[id]/invite`: `403 ended` after the trip end, `409 already_joined` once an account is linked). A valid, unexpired invite token remains acceptable after the cutoff until the trip ends — the trip day is the UTC calendar day of `endDate`, falling back to `startDate` — and post-cutoff acceptance only links `userId` + consent while populated fields stay protected; a token presented after the trip ends resolves to reason `ended`. Valid, unexpired tokens MAY fill gaps without overwriting protected identity or an existing account link. Concurrent fills or token consumption MUST reject stale updates, not overwrite them.

#### Scenario: XSED purchase precedes the new cutoff
- GIVEN an XSED trip bought Sunday for the following Saturday with an old lock stamp
- WHEN the buyer opens either roster surface before T-72h
- THEN the fields are editable and the displayed deadline is T-72h

#### Scenario: Late completion preserves saved details
- GIVEN the cutoff has passed and a row has a saved name/email but no ID
- WHEN the buyer saves the ID or the invited companion submits a live token
- THEN only missing details are filled and the saved identity remains unchanged
- AND attempts to change populated fields or a previously linked account are rejected

#### Scenario: Late companion can still join
- GIVEN the cutoff has passed, the trip has not ended, and a populated, unlinked row holds a live token
- WHEN the companion signs in with the invited email and submits
- THEN `userId` is linked, consent is stamped, and all populated fields are unchanged

#### Scenario: Token dies when the trip ends
- GIVEN a live token for a trip whose end date (UTC day) has passed
- WHEN the link is opened or submitted
- THEN the response reason is `ended` and nothing is written

#### Scenario: Dashboard Save now persists adult and minor edits
- GIVEN the buyer edits an adult row's idPassport and a minor row's dateOfBirth on `dashboard/trips/[id]/page.tsx`
- WHEN the buyer clicks the page's Save button (now wired to `rosterRef.current.saveAll()`)
- THEN both rows persist identically to editing the same fields on the checkout success page

### Requirement: Automatic XSED Buyer Reminder

The hourly traveler-reminder job MUST email the buyer on its first run at/after T-72h and before departure when a paid, non-cancelled, non-completed XSED trip has missing required companion details, including uninvited or not-yet-materialized roster rows. The localized email MUST link to the buyer's trip detail page and explain that empty fields remain editable while saved details are protected. A completed roster, solo trip, other product, unpaid trip, departed trip, or already-reminded booking MUST NOT receive this email.

Delivery MUST be awaited. A guarded, recoverable claim prevents overlapping workers; `travelerDetailsReminderSentAt` is persisted only after provider acceptance. Failed attempts remain retryable with a stable provider idempotency key. Provider acceptance followed by a prolonged database outage still has the provider's finite deduplication-window limitation; this is not an exactly-once delivery guarantee.

**Rollout:** apply `prisma/migrations/20260928120000_traveler_details_reminder/migration.sql` through the database deployment workflow before deploying this code, then generate Prisma Client. This repository's `npm run db:migrate` uses `prisma db push`, not a migration runner. No customer record repair is required for legacy XSED locks.

### Requirement: Companion Permission Parity Is Not Narrowed (v1 Accepted Gap)

A companion linked via `TripTraveler.userId` receives the SAME `dashboard/trips/[id]` permissions as the buyer in v1 — the same trip card and detail page render with full buyer-level actions. This is an accepted risk, not an oversight; permission scoping is deferred to a follow-up change.

#### Scenario: Companion has buyer-level access (documented, not a defect)
- GIVEN a companion linked to a trip via `TripTraveler.userId`
- WHEN they open that trip's detail page
- THEN they see and can act on it exactly as the buyer would, with no permission narrowing
