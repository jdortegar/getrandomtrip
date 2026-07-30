# invite-travel-friends Specification

## Change: `invite-travel-friends`

New capabilities: `companion-travelers` (roster model, lifecycle, edit/lock rules) and
`companion-invite` (tokenized no-login invite + landing). No prior spec exists for either —
full specs below. Also modifies: checkout success page, dashboard trip detail,
`transactional-email` catalogue, in-app notifications. See `proposal.md` for scope/risk detail.

## Purpose

Defines the `TripTraveler` roster created after payment success, its `PENDING → INVITED →
COMPLETE` lifecycle, the pre/post-cutoff edit and lock rules (cutoff = `startDate − 7 days`,
enforced server-side), the buyer-completion notification, and the tokenized no-login companion
invite flow (`/invite/[token]`), including gender-neutral bilingual copy.

## Requirements

### Requirement: Roster Creation on Payment Success

On payment success, the system MUST create one `TripTraveler` row per companion, count =
`paxDetails.adults + paxDetails.minors − 1`, clamped to `≥ 0`. Missing/non-numeric `adults` or
`minors` MUST be treated as `0` rather than erroring. If the clamped count is `0`, the roster
section MUST NOT render. Row `kind` MUST be assigned `ADULT` first, then `MINOR`, matching the
paid split. All rows start in `PENDING`.

#### Scenario: Normal party
- GIVEN a paid `TripRequest` with `paxDetails: {adults: 2, minors: 1}`
- WHEN payment succeeds
- THEN 2 `TripTraveler` rows are created (1 adult, 1 minor), all `PENDING`

#### Scenario: Malformed paxDetails
- GIVEN `paxDetails` is missing or has non-numeric `adults`/`minors`
- WHEN payment succeeds
- THEN the system treats missing fields as `0`, clamps the row count at `≥ 0`, and never throws

#### Scenario: Solo traveler
- GIVEN `paxDetails: {adults: 1, minors: 0}`
- WHEN payment succeeds
- THEN 0 `TripTraveler` rows are created and the invite section is not shown

### Requirement: Adult Row Fields and Invite Action

An `ADULT` row MUST expose `name`, `email`, `idPassport` fields and a status pill
(`PENDING`/`INVITED`/`COMPLETE`). The buyer MUST be able to either save the row directly or
send/resend an email invite via a send action. Sending/resending MUST set `status: INVITED`,
stamp/refresh `invitedAt`, and rotate the invite token (invalidating any prior token). A row
manually completed by the buyer (no invite sent) MUST go directly to `COMPLETE`.

#### Scenario: Buyer sends first invite
- GIVEN an adult row in `PENDING` with a valid email
- WHEN the buyer clicks send-invite
- THEN status becomes `INVITED`, `invitedAt` is stamped, and an invite email is sent

#### Scenario: Resend rotates token
- GIVEN an adult row already `INVITED` with token hash `H1`
- WHEN the buyer clicks resend
- THEN a new token is issued (hash `H2` ≠ `H1`), `invitedAt` is refreshed, and `H1` no longer
  resolves

#### Scenario: Buyer fills adult row directly
- GIVEN an adult row in `PENDING`
- WHEN the buyer saves name/email/idPassport directly without sending an invite
- THEN status becomes `COMPLETE`

### Requirement: Minor Row Direct-Save Validation

A `MINOR` row MUST expose `name`, `dateOfBirth`, `idPassport` — no `email` field, no invite
action; only the buyer can populate it. The system MUST require all three fields before setting
`status: COMPLETE`; a save attempt with any field blank MUST be rejected with an inline
"fill in all fields" error and the row MUST remain in its current status.

#### Scenario: Complete minor save
- GIVEN a minor row with `name`, `dateOfBirth`, `idPassport` all filled
- WHEN the buyer saves
- THEN status becomes `COMPLETE`

#### Scenario: Incomplete minor save rejected
- GIVEN a minor row missing `idPassport`
- WHEN the buyer attempts to save
- THEN the save is rejected, an inline "fill in all fields" error is shown, and status is
  unchanged

### Requirement: Edit Rules and Cutoff Enforcement

The cutoff is `TripRequest.startDate − 7 days`. Before cutoff, the buyer MAY edit any row's
data on the success page or dashboard but MUST NOT add or remove rows (count is fixed by paid
pax). At/after cutoff, every row MUST lock: all traveler write endpoints MUST reject edits
server-side regardless of client state, and the UI MUST render disabled inputs with no icon
actions and a lock banner + support link.

#### Scenario: Pre-cutoff edit allowed
- GIVEN today is more than 7 days before `startDate`
- WHEN the buyer edits a traveler row's fields
- THEN the update is accepted and persisted

#### Scenario: Post-cutoff write rejected server-side
- GIVEN today is on or after `startDate − 7 days`
- WHEN a write request hits the traveler update endpoint with a still-editable-looking client
  state
- THEN the API rejects the write regardless of client-side disabled state
- AND the UI reflects locked rows with no icon actions

#### Scenario: No add/remove at any time
- GIVEN a roster of N rows fixed at payment success
- WHEN the buyer or any request attempts to add or remove a row
- THEN the request is rejected; changing party size requires contacting support

### Requirement: Blocking Until Cutoff

Any traveler row not in `COMPLETE` MUST block trip processing until the cutoff. Reminder
nudges (in-app on success page/dashboard + email) MUST continue to surface for incomplete rows
on every scheduled pass up to and including the cutoff pass, which locks the roster.

#### Scenario: Incomplete rows block processing pre-cutoff
- GIVEN a `TripRequest` with at least one non-`COMPLETE` traveler row and cutoff not yet reached
- WHEN trip processing eligibility is checked
- THEN the trip is marked not-yet-processable and reminders continue

#### Scenario: Cutoff pass locks and stops reminders
- GIVEN the cutoff has been reached
- WHEN the reminder/cutoff job's lock pass runs
- THEN all non-`COMPLETE` rows are locked server-side and no further reminders are sent for
  that trip

### Requirement: Buyer Notification on Companion Completion

When a companion row transitions to `COMPLETE` (whether by invite submission or buyer direct
save), the system MUST create an in-app `Notification` (type `TRAVELER_SUBMITTED`) for the
buyer and MUST send a companion-completion email, idempotently (one notification per
completion transition, not per read).

#### Scenario: Companion submits via invite
- GIVEN an `INVITED` adult row
- WHEN the companion submits via `/invite/[token]`
- THEN status becomes `COMPLETE` and the buyer receives one `TRAVELER_SUBMITTED` notification +
  email

#### Scenario: No duplicate notification on re-render
- GIVEN a row already `COMPLETE`
- WHEN the success page or dashboard re-renders that row
- THEN no additional notification is created

### Requirement: Companion Invite Token Lifecycle

Invite tokens MUST follow the hash-in-DB pattern: a `randomBytes(32)` plaintext token exists
only in the emailed URL; only its SHA-256 hash is persisted, inline on the `TripTraveler` row
(`inviteTokenHash`, `inviteTokenExpiresAt`). Rendering `/invite/[token]` MUST **peek** the
token (resolve validity without consuming). Submission MUST **consume** the token — re-checking
validity and the cutoff server-side before writing.

#### Scenario: Valid token peek
- GIVEN an unexpired, unconsumed invite token for a `PENDING`/`INVITED` row
- WHEN `/invite/[token]` is requested
- THEN the page renders the form; peeking does not consume or expire the token

#### Scenario: Expired token
- GIVEN a token whose `inviteTokenExpiresAt` is in the past
- WHEN `/invite/[token]` is requested
- THEN an expired-state view renders with no form

#### Scenario: Already-consumed token
- GIVEN a token for a row already `COMPLETE`
- WHEN `/invite/[token]` is requested
- THEN an already-submitted state view renders with no form

#### Scenario: Submission after cutoff rejected
- GIVEN a still-valid, unconsumed token but the cutoff has passed
- WHEN the companion submits the form
- THEN the submit-from-token route rejects the write server-side regardless of token validity

### Requirement: Companion Invite Landing — No-Login Submission

`/invite/[token]` MUST require no account/session. It MUST show the buyer's first name and
neutral invite copy (no gendered pronoun), MUST NOT reveal the destination, and MUST render
`name`/`email`/`idPassport` fields (adult) with a required consent checkbox that blocks submit
until checked. An optional "create a free account" link MAY be shown but MUST NOT be required
to submit.

#### Scenario: Consent gates submit
- GIVEN the companion has filled all fields but left the consent checkbox unchecked
- WHEN they attempt to submit
- THEN submission is blocked client- and server-side until the checkbox is checked

#### Scenario: Destination never revealed
- GIVEN any valid, unconsumed token
- WHEN `/invite/[token]` renders
- THEN no destination name or reveal-related content appears anywhere on the page

#### Scenario: Account creation optional
- GIVEN a valid token and a fully completed, consented form
- WHEN the companion submits without following the account-creation link
- THEN the submission succeeds and the row becomes `COMPLETE`

### Requirement: Gender-Neutral Bilingual Invite Copy

All new invite/roster/landing copy MUST exist in a new `inviteTravelers` dictionary section
in both `src/dictionaries/es.json` and `src/dictionaries/en.json`, typed via a new interface in
`src/lib/types/dictionary.ts`. The invite/landing greeting MUST NOT hardcode a gendered pronoun
for the buyer (e.g. MUST NOT read "...join her randomtrip"); it MUST use neutral phrasing (e.g.
"{buyerFirstName} invited you to join their randomtrip") in both locales.

#### Scenario: Dictionary parity
- GIVEN the `inviteTravelers` section is added
- WHEN `npm run typecheck` runs
- THEN no missing-key errors are reported for either locale

#### Scenario: Neutral greeting rendered
- GIVEN a buyer named Alex with any gender
- WHEN the invite email or `/invite/[token]` landing renders the greeting
- THEN the copy uses neutral phrasing with no gendered pronoun, in both `es` and `en`

## Out of Scope

- Full account-creation-from-invite wiring (pre-fill + linking `User` to `TripTraveler`).
- Analytics/funnel instrumentation (invite-sent, opened, completion-rate).
- Multi-stage escalating reminder cadence — v1 sends a single reminder pass.
- Add/remove-row UI for changing party size post-checkout.
- Minor-specific cross-field validation (e.g. DOB-implies-minor vs. `paxDetails.minors`).
- Backfill of `TripTraveler` rows for pre-existing paid trips.

## Schema Delta

| Change | Detail |
|--------|--------|
| `TripTraveler` model | ADDED — FK to `TripRequest`; `kind`, `status`, name/email/idPassport/dateOfBirth, `inviteTokenHash`, `inviteTokenExpiresAt`, `invitedAt`, `submittedAt`, `consentAt` |
| `TravelerKind` enum | ADDED — `ADULT` \| `MINOR` |
| `TravelerStatus` enum | ADDED — `PENDING` \| `INVITED` \| `COMPLETE` |
| `NotificationType` enum | MODIFIED — add `TRAVELER_SUBMITTED` |

## API Contracts

| Endpoint | Auth | Behavior |
|----------|------|----------|
| `POST/PATCH /api/travelers/[id]` | buyer session, owns `TripRequest` | Create/update a row; rejects add/remove; rejects writes at/after cutoff |
| `POST /api/travelers/[id]/invite` | buyer session | Sends/resends invite; rotates token, stamps `invitedAt` |
| `POST /api/travelers/submit-from-token` | public, token-gated | Peeks then consumes token; validates cutoff + consent server-side; writes row to `COMPLETE` |
| `GET /api/stripe/trip-summary` (modified) | buyer session | Extends payload with `paxDetails` + traveler rows via shared serializer |
| `GET /api/trips/[id]` (modified) | buyer session | Extends payload with traveler rows via the same shared serializer |
| `POST /api/internal/traveler-reminder` | `CRON_SECRET` | Pass 1: reminder emails for incomplete rows pre-cutoff; Pass 2: server-side lock at cutoff |
