# Spec: Companion Invite — Required Signup Before Submission

## Change Context

This spec supersedes the prior "No-Login Submission" requirement from `openspec/changes/archive/2026-07-29-invite-travel-friends/spec.md` (archived spec never promoted to main), consolidating the final authoritative companion-invite capability definition.

**Changed by**: `traveler-invite-required-signup` (status: completed, all 32 tasks green); amended by `companion-invite-auto-send` (phase 1: accept until trip end, invited-email match, auto-send on save, rewritten email, backfill script; phase 2: verified email required to accept, joined-email lock, reduced companion view, invited-but-not-linked reminder, buyer roster badge, deploy-origin links, masked invite payload, dry-run backfill without production env).

---

## Domain: companion-invite

### Requirement: Companion Invite Landing — Signup Required

(Previously: "No-Login Submission" — anonymous submit allowed; account creation was an optional link. Now: authentication via `AuthModal` is mandatory before any identity data can be entered.)

`/invite/[token]` MUST render a two-step, session-driven state machine. **Step 1 (no session)**: only the personalized greeting (buyer first name, neutral pronoun, no destination reveal) and a "Sign up to continue" CTA opening `AuthModal` (`allowRegister: true`, `defaultMode="register"`, with an editable, unprefilled email field) and a hint showing only the masked invited address ("Use the email this invite was sent to: j***@gmail.com") render — no identity fields, no submit path exists in the DOM. **Step 2 (session present, any auth state including unverified email)**: collects only `idDocument` + a required consent checkbox; a populated, protected ID after cutoff is not asked again. `name`/`email` MUST NOT be asked. The page MUST NOT gate rendering step 2 on the invite itself, but a signed-in account whose `emailVerified` is false (from the DB-backed session) sees a localized "Check your inbox: we sent a verification link to {masked}. After verifying, you'll come back here to join the trip." state instead of the form, and the same state appears when submit answers `email_unverified`. `{masked}` MUST be the signed-in account's own address (the one the link goes to), falling back to the invited masked address only when the session has no email; the mismatch state always takes precedence over this state. That state MUST offer a localized "Resend verification email" button that calls `POST /api/auth/resend-verification` with `{ returnPath: "/{locale}/invite/{token}" }`, shows a pending (busy, duplicate-safe) state, and then a localized sent / cooldown / already-verified / error message; failures leave the button usable. No automatic send happens on first visit: the button is the way out for pre-existing unverified accounts that signed in through the invite bypass. The full invited email MUST NOT appear in the server-rendered page payload (props, HTML) for any viewer who is not signed in with that address: `peekTravelerInvite(token, viewerEmail?)` returns `invitedEmail` only when the viewer's session email matches and otherwise only `maskedEmail`; the page forwards a boolean `emailMismatch` for a signed-in non-matching viewer. The server-side `email_mismatch` check on submit stays the enforcement, and a mismatch discovered there renders the same masked message.

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

#### Scenario: Unverified email waits for verification
- GIVEN a companion just registered and `session.user.emailVerified` is false
- WHEN the page evaluates whether to show step 2
- THEN the check-your-inbox state renders (masked address only) and no form exists in the DOM

#### Scenario: Resend verification from the invite page
- GIVEN a signed-in, unverified companion on the check-your-inbox state
- WHEN they press "Resend verification email"
- THEN `POST /api/auth/resend-verification` replaces any outstanding `EMAIL_VERIFY` token and emails the session account only; the body's optional `returnPath` is honoured only when it passes `safeInviteReturnPath`, so the new link also returns to the invite. The send is awaited (`deliverVerificationEmail`) before responding: on provider failure the freshly issued token is deleted (so the 60s cooldown does not block an immediate retry) and the route answers `502 { error: "send_failed" }`, which the client shows as the retryable error state
- AND the endpoint answers 401 without a session, 409 `already_verified` for a verified account, and 429 `cooldown` (with `Retry-After`) when the newest `EMAIL_VERIFY` token is under 60 seconds old, sending nothing in those cases; it never accepts a target address, so it cannot reveal whether other emails exist

#### Scenario: Verification link returns to the invite
- GIVEN a companion registered from `/{locale}/invite/{token}` via the invite page
- WHEN they open the verification link from the email
- THEN the verify page sends them back to `/{locale}/invite/{token}` rather than to login, and a `next` value that is not exactly a relative `/(es|en)/invite/{token}` path is ignored (no open redirect)

#### Scenario: Full invited email never reaches an anonymous or mismatched viewer
- GIVEN an anonymous visitor, or a visitor signed in with another address, opens a valid `/invite/[token]`
- WHEN the page is server-rendered
- THEN the payload carries only the masked address (`j***@gmail.com`); the sign-up modal gets no `initialEmail`/`lockEmail`

#### Scenario: Matching signed-in account behaves as before
- GIVEN a session whose email matches the invited email (case-insensitive, trimmed)
- WHEN the page renders
- THEN the payload carries the invited email and step 2 renders directly

#### Scenario: Signed-in account with a different email is blocked
- GIVEN a session whose email differs (case-insensitive, trimmed) from the invited email, detected by the server on render or by `email_mismatch` on submit
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

`src/lib/auth.ts`'s credentials `authorize()` MUST continue to throw `EMAIL_NOT_VERIFIED` and issue no session for any unverified account, UNLESS a live, unconsumed traveler-invite grant accompanies the login attempt. The grant MUST be carried by a short-lived httpOnly cookie (`grt_traveler_invite`), minted only by `POST /api/travelers/invite-auth-init` after a server-side `peekTravelerInvite` confirms the token is valid and unconsumed; the route MUST NOT set the cookie when the peek fails. `authorize()` MUST evaluate this cookie only inside its existing `!user.emailVerified` branch and MUST NOT require the invite's target email to match the authenticating user's email. This exception MUST apply identically regardless of whether the session originates from a freshly registered account or a pre-existing unverified account, since both paths call the same `authorize()`. No other login path may read or be affected by this cookie. The bypass only yields a session so the invite page can show its in-page verification state; it grants no claim, because accepting an invite requires a verified email (see Session-Gated Submission Endpoint).

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

`POST /api/travelers/submit` MUST require `getServerSession`; MUST return `401` with none. Payload narrows to `{ token, idDocument, consent }` — `fullName`/`email` MUST be derived server-side from `session.user.name`/`session.user.email`, never trusted from the client. On success the endpoint performs the existing `consumeTravelerInvite` writes (`status → COMPLETE`, `submittedAt`, `consentAt`) PLUS sets `TripTraveler.userId = session.user.id`. Token expiry and single-use consumption are unchanged. Cutoff protection follows the field-level policy below; populated identity and account ownership must not be overwritten after cutoff. The endpoint MUST reject with `403` and error `email_mismatch` when the normalized (trim + lowercase) session email differs from the normalized `TripTraveler.email`, or when the row has no email; the check runs inside `consumeTravelerInvite` and writes nothing. It MUST also reject with `403` and error `email_unverified` when the claiming account's `User.emailVerified` is null, read from the DB row (never the client, session or JWT); the mismatch check runs first. Google sign-in marks an existing unverified account verified (new Google accounts are created verified).

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

#### Scenario: Unverified account rejected
- GIVEN a valid token and a session whose email matches the invite but whose account `emailVerified` is null
- WHEN the account submits
- THEN the response is `403 { error: "email_unverified" }` and the row is unchanged

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
- THEN the response is `200` with the reduced companion view defined in "Companion Reduced Read-Only View" below

#### Scenario: Companion still cannot delete the trip
- GIVEN user C is linked via `TripTraveler.userId` to a trip bought by user B (C is not the buyer)
- WHEN C calls `DELETE /api/trips/[id]` for that trip
- THEN the response is `403 Forbidden`, unchanged from buyer-only deletion — this route is intentionally NOT routed through the shared read predicate

#### Scenario: Unrelated user is still forbidden
- GIVEN user X has no `TripRequest.userId` ownership and no `TripTraveler.userId` link to a trip
- WHEN X calls `GET /api/trip-requests` or `GET /api/trips/[id]` for that trip
- THEN the trip is absent from X's list, and the detail call returns `403 Forbidden` — unchanged from current behavior

### Requirement: Edit Rules and Cutoff Enforcement

The cutoff is departure − 72 elapsed hours for XSED and departure − 7 days for other trips, where departure is 00:00 of the trip's start calendar date in `TripRequest.departureTimeZone` (a Saturday trip from Argentina locks Wednesday 00:00 ART for XSED). Before cutoff, the buyer MAY edit any row's data on either surface and a companion only their own linked row (see "Companion Reduced Read-Only View"); nobody may add/remove rows. XSED's legacy T-7d `travelersLockedAt` stamps MUST NOT override the new cutoff.

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

### Requirement: Auto-Sent Companion Invite

`PATCH /api/travelers/[id]` MUST, after a successful save of an ADULT row with `userId` null on a trip that has not ended, issue a fresh invite token and send the invite email when the saved email is valid and is new (previous email empty) or different (normalized) from the previous one. Re-saving the same email MUST send nothing; changing the email rotates the token so the old link dies. Issue/send failures MUST NOT fail the save. The response carries `invited: true` only when a token was actually issued; the row only becomes `INVITED` when issuance succeeded. When issuance throws, the save still succeeds, the row is not marked `INVITED`, and the response carries `inviteFailed: true` (the client shows the send error and keeps "Resend invite" available). The buyer roster action is labeled "Resend invite" and, when a save already auto-sent, the UI MUST NOT POST a second invite.

Status semantics: the auto-invited row becomes `INVITED`, and an `INVITED` row is never flipped to `COMPLETE` by a buyer save — `COMPLETE` means the companion accepted (it makes the token read as `used`). Roster completeness (`submitted` count, page Save result) is `status in (COMPLETE, INVITED)` with every required detail present (`isTravelerRosterComplete`).

#### Scenario: First email save sends one invite
- GIVEN an adult row with no email
- WHEN the buyer saves a valid email
- THEN exactly one token is issued and one email sent, and the row status is `INVITED`

#### Scenario: Same-email re-save sends nothing
- GIVEN an adult row already holding `bob@example.com`
- WHEN the buyer saves ` Bob@Example.com `
- THEN no token is issued and no email is sent

#### Scenario: Changed email rotates the token
- GIVEN an invited, unlinked row
- WHEN the buyer saves a different email
- THEN a new token is issued (the previous link dies) and a new email is sent

### Requirement: Companion Invite Email

The invite email subject MUST be "{buyer} te sumó a su randomtrip" (es) / "{buyer} added you to their randomtrip" (en), in the buyer's locale; with an empty buyer first name the subject and body fall back to "Te sumaron a un randomtrip" / "You've been added to a randomtrip". The body MUST include the localized trip dates and trip type label, MUST mention creating an account to see the trip in the dashboard and confirm details, MUST keep the 7-day expiry line, and MUST NEVER include the destination. The CTA is "VER MI VIAJE" / "SEE MY TRIP". Invite and reminder links are built from the deploy origin (`getInviteOrigin`): `https://getrandomtrip.com` in production, `getNonproductionOrigin()` otherwise, falling back to the production site only when a nonproduction deploy has no valid public origin.

### Requirement: Companion Invite Backfill Script

`scripts/backfill-companion-invites.ts` (`npm run db:backfill-companion-invites`) is a one-off tool for rows added before auto-send. It defaults to a dry run that prints ADULT rows with a non-empty email, `invitedAt` null, `userId` null, on a non-cancelled trip with an APPROVED payment that has not ended (emails masked). `--send` issues tokens and sends sequentially, reporting per-row results, and MUST be refused unless `RT_DEPLOY_ENV=production`. The dry run MUST work without `RT_DEPLOY_ENV=production`: the app modules (token issuer, mailer, which load `src/lib/prisma.ts` and its nonproduction DB-host guard) are imported dynamically only for `--send`; a dry run uses only the script's own client. The send run requires explicit owner approval of the dry-run list.

### Requirement: Companion Invite Reminder

Pass 1 of the hourly traveler-reminder job MUST send exactly ONE reminder to each ADULT row with `invitedAt` set, `userId` null, `reminderSentAt` null and an email, on a paid, non-cancelled, non-completed trip that has not ended (`isTripEnded`). A row is due when `now >= min(invitedAt + 3 days, startDate - 24h)` (trips without a start date use only the first term). It is not gated by the details cutoff or the row status. The job rotates the token, awaits delivery of the reminder email (provider acceptance), and only then stamps `reminderSentAt`; a failed send leaves the row unstamped for the next run. The reminder uses the "see my trip" framing (dates and trip type, never the destination; CTA "VER MI VIAJE" / "SEE MY TRIP"), in the buyer's locale with the same empty-name fallback as the invite.

#### Scenario: Due by invite age
- GIVEN an invited, unlinked companion whose invite is 3 days old on a trip that has not ended
- WHEN the job runs
- THEN one reminder is sent with a fresh token and `reminderSentAt` is stamped

#### Scenario: Due by departure
- GIVEN an invite younger than 3 days and a trip starting in 24h or less
- WHEN the job runs
- THEN the reminder is sent

#### Scenario: Not reminded twice or after joining or after the trip
- GIVEN a row already stamped, linked to an account, or on an ended trip
- WHEN the job runs
- THEN nothing is sent

### Requirement: Joined Companion Email Is Locked

Once a roster row is linked to an account (`userId` set), `PATCH /api/travelers/[id]` MUST reject any change to its email, for every viewer including the buyer, with `403 { error: "email_locked_joined" }` and no write. Re-saving the same address (case/whitespace-insensitive) is not an error and other edits allowed by the cutoff rules keep working. The buyer roster shows the email read-only with a localized hint on a Joined row.

### Requirement: Buyer Roster Invite Badge

Each ADULT row in the buyer's roster MUST show an invite badge derived from saved values: "No email" (no saved email), "Invitation sent {date}" (email, `invitedAt` set, no account linked; "Resend invite" stays available), "Joined" (account linked; "Resend invite" is hidden), or "Invite not sent" (email saved but no invite went out). The existing status badge (missing-details indication) is unchanged. The roster DTO exposes `invitedAt` and a boolean `joined`, never the linked user id.

### Requirement: Companion Reduced Read-Only View

For a viewer who can access a trip but is not its buyer (`tripRoleFor` = `companion`), the server MUST enforce a reduced view; the UI never receives what it must hide. `GET /api/trips/[id]` returns `role: "companion"` and omits `payment` and `basePriceUsd` (and raw `travelers` rows); `GET /api/trips` omits `payment` and `basePriceUsd` on the trips the viewer joined. The roster (`getRosterForTrip(tripId, viewerUserId)`) marks `viewerRole: "companion"`, returns the viewer's own linked row in full (`isSelf: true`) and every other traveler as a name only (email, `idDocument`, `dateOfBirth`, `invitedAt`, `submittedAt` null, `joined` false); `submitted` is still the trip-level count. `PATCH /api/travelers/[id]` lets a companion edit only their own linked row, within the normal cutoff rules, and never change its email (`403`); `POST /api/travelers/[id]/invite` is buyer-only (`403` for a companion). The buyer's behavior is unchanged. The dashboard trip page hides the cost summary, payment card and invite/resend controls for a companion and renders others as read-only name rows. `DELETE /api/trips/[id]` stays buyer-only.

#### Scenario: Companion payload is sanitized
- GIVEN a companion linked to a trip with two other travelers
- WHEN they call `GET /api/trips/[id]`
- THEN the payload has no price or payment fields, their own row is complete, and the other rows carry names only

#### Scenario: Companion cannot edit others or invite
- GIVEN a companion
- WHEN they PATCH another traveler's row, change their own row's email, or POST an invite
- THEN each is rejected with `403` and nothing is written

### Requirement: Automatic XSED Buyer Reminder

The hourly traveler-reminder job MUST email the buyer on its first run at/after T-72h (measured from local-midnight departure in `departureTimeZone`) and before departure when a paid, non-cancelled, non-completed XSED trip has missing required companion details, including uninvited or not-yet-materialized roster rows. The localized email MUST link to the buyer's trip detail page and explain that empty fields remain editable while saved details are protected. A completed roster, solo trip, other product, unpaid trip, departed trip, or already-reminded booking MUST NOT receive this email.

Delivery MUST be awaited. A guarded, recoverable claim prevents overlapping workers; `travelerDetailsReminderSentAt` is persisted only after provider acceptance. Failed attempts remain retryable with a stable provider idempotency key. Provider acceptance followed by a prolonged database outage still has the provider's finite deduplication-window limitation; this is not an exactly-once delivery guarantee.

**Rollout:** apply `prisma/migrations/20260928120000_traveler_details_reminder/migration.sql` through the database deployment workflow before deploying this code, then generate Prisma Client. This repository's `npm run db:migrate` uses `prisma db push`, not a migration runner. No customer record repair is required for legacy XSED locks.
