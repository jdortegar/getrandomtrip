# admin-traveler-messaging Specification

## Purpose

New capability (no prior spec exists). Lets an admin compose and send a branded, traveler-localized email from `/dashboard/admin/trip-requests/[id]`, replacing the raw `mailto:` handoff, with a synchronous send result and a write-only per-attempt audit trail.

## Requirements

### Requirement: Compose Modal With Prefilled Localized Content

The system MUST open a compose modal, built from the existing `Modal`/`FormField`/`TextAreaInput` primitives, prefilled with a localized subject and body (greeting uses `trip.user.name`, sign-off "the GetRandomTrip team") — nothing blank by default. The body MUST be plain text only, rendered by the email template as paragraphs split on newlines; no rich text editor, no HTML input, no sanitization surface.

#### Scenario: Modal opens with both fields prefilled
- GIVEN an admin clicks "Contact traveler" on the fulfillment header
- WHEN the modal opens
- THEN both the subject and body fields already contain localized, non-blank content

#### Scenario: Admin edits before sending
- GIVEN the modal is open with prefilled content
- WHEN the admin changes the subject and/or body
- THEN the edited plain-text values are what gets sent, not the original prefill

### Requirement: Synchronous Awaitable Send With Real Result

The email MUST be sent through an `await`-able function that throws on failure, unlike the app's existing fire-and-forget `send*` functions. The modal MUST await the API result and render a distinct success state or a distinct failure state — never an optimistic "sent" state shown before the outcome is known.

#### Scenario: Successful send shows success state
- GIVEN the admin submits the compose form
- WHEN the send completes without error
- THEN the modal shows a success state

#### Scenario: Failed send shows failure state, not silent success
- GIVEN `RESEND_API_KEY` is unset or Resend returns an error
- WHEN the admin submits the compose form
- THEN the modal shows a distinct failure state and does not silently swallow the error

### Requirement: Reply-To Routes to the Sending Admin

The outgoing email's `replyTo` MUST be the sending admin's own email address, looked up server-side from `adminId` — never a shared inbox.

#### Scenario: Traveler reply reaches the sending admin
- GIVEN admin A sends a contact message on a trip
- WHEN the traveler replies to the received email
- THEN the reply is addressed to admin A's own email, not a shared/support inbox

### Requirement: Server-Side Traveler Locale Resolution

The traveler's email locale MUST be resolved server-side via `resolveLocale(user.locale)` from a `prisma.user` lookup keyed off the trip — never from a client-supplied value or the admin's own dashboard locale, since `AdminTripUser` carries no `locale` field.

#### Scenario: Email renders in the traveler's stored locale
- GIVEN a traveler's stored `locale` differs from the sending admin's dashboard locale
- WHEN the admin sends a contact message
- THEN the email renders in the traveler's stored locale, not the admin's

### Requirement: Write-Only Audit Row Per Attempt

The system MUST write exactly one `TripContactMessage` row per send attempt, regardless of outcome: `status: SENT` on success, or `status: FAILED` with a non-null `error` on failure. Every row MUST denormalize the sending admin's email as a plain `adminEmail` string captured at send time, in addition to the `adminId` FK (`onDelete: SetNull`). Rows MUST cascade-delete with their `TripRequest` (`onDelete: Cascade`). This capability exposes no `GET` endpoint, history list, or viewer — rows are read only by direct DB query.

#### Scenario: Successful send is audited
- GIVEN a send completes successfully
- WHEN the audit row is inspected
- THEN it has `status: SENT`, no `error`, and the sending admin's `adminId` and `adminEmail`

#### Scenario: Failed send is still audited with an error detail
- GIVEN a send throws
- WHEN the audit row is inspected
- THEN it has `status: FAILED` and a non-null `error` — never a silently skipped row

#### Scenario: Audit row survives sending-admin deletion
- GIVEN the sending admin's `User` record is later deleted
- WHEN the `TripContactMessage` row is read
- THEN `adminId` is null but `adminEmail` still identifies who sent it

#### Scenario: Deleting the trip cascades its contact messages
- GIVEN a `TripRequest` has one or more `TripContactMessage` rows
- WHEN the `TripRequest` is deleted
- THEN its contact messages are deleted along with it

### Requirement: Admin-Only Authorization

`POST /api/admin/trip-requests/[id]/contact` MUST be guarded by `requireAdmin()`. Unauthenticated requests MUST receive `401`; authenticated requests from a caller without the admin role MUST receive `403`.

#### Scenario: Unauthenticated request rejected
- GIVEN no active session
- WHEN the contact endpoint is called
- THEN the API returns `401` and no email is sent

#### Scenario: Non-admin authenticated request rejected
- GIVEN a session for a user without the admin role
- WHEN the contact endpoint is called
- THEN the API returns `403` and no email is sent

### Requirement: No Status Restriction

The contact action MUST be available on every `TripRequest.status` value, identical to the `mailto:` link it replaces — no status-based gating.

#### Scenario: Works on a DRAFT trip
- GIVEN a trip is in `DRAFT` status
- WHEN the admin submits the compose modal
- THEN the send proceeds with no status-based rejection

#### Scenario: Works on a CANCELLED trip
- GIVEN a trip is in `CANCELLED` status
- WHEN the admin submits the compose modal
- THEN the send proceeds with no status-based rejection
