# Spec: Destination Reveal Flow

**Change:** destination-reveal-flow  
**Artifact store:** openspec  
**Capabilities covered:** destination-reveal (NEW), 05-client-dashboard (MODIFIED), 06-xsed (MODIFIED)

---

## 1. destination-reveal — Full Spec (New Capability)

### Requirement: Schema — destinationAssignmentNotifiedAt field

`TripRequest` MUST add a nullable `DateTime` field `destinationAssignmentNotifiedAt`. The field MUST default to `NULL`. `NotificationAudience` enum MUST include `ADMIN` as a valid value.

#### Scenario: Field is NULL on existing and new trip requests

- GIVEN a `TripRequest` in any status
- WHEN the migration runs
- THEN `destinationAssignmentNotifiedAt` is `NULL` and the trip request is otherwise unaffected

#### Scenario: ADMIN audience value is available

- GIVEN a `Notification` record is being created
- WHEN `audience` is set to `ADMIN`
- THEN Prisma accepts the value and persists the record

---

### Requirement: Cron Authentication

The internal route `POST /api/internal/destination-reveal` MUST reject any request whose `Authorization` header is not `Bearer ${CRON_SECRET}`. Requests without the header or with a wrong secret MUST return HTTP 401 and take no action.

#### Scenario: Valid secret

- GIVEN a request to `POST /api/internal/destination-reveal`
- WHEN `Authorization: Bearer <valid CRON_SECRET>` is present
- THEN the route processes both passes and returns HTTP 200

#### Scenario: Missing or invalid secret

- GIVEN a request to `POST /api/internal/destination-reveal`
- WHEN the `Authorization` header is absent or carries a wrong secret
- THEN the route returns HTTP 401 and neither pass runs

---

### Requirement: Scheduled Function

A Netlify scheduled function `destination-reveal.ts` MUST fire on schedule `0 * * * *` (hourly). It MUST call `POST /api/internal/destination-reveal` with `Authorization: Bearer ${CRON_SECRET}`. It MUST return the HTTP status and body from the internal route unchanged.

#### Scenario: Healthy invocation

- GIVEN `URL` and `CRON_SECRET` env vars are present
- WHEN the cron fires
- THEN the function calls the internal route and returns its response

#### Scenario: Missing env vars

- GIVEN `URL` or `CRON_SECRET` is absent
- WHEN the cron fires
- THEN the function returns HTTP 500 with body `"misconfigured"` and does not call the route

---

### Requirement: Pass 1 — T-72h Admin Assignment Reminder

The T-72h pass MUST query all `CONFIRMED` trips where `startDate <= now + 72h` AND `destinationAssignmentNotifiedAt IS NULL`. For each matching trip it MUST: (a) create one `Notification` per admin user with `audience = ADMIN` and type `BOOKING_CONFIRMED`; (b) send one `DestinationAssignmentReminder` email to every admin user; (c) set `destinationAssignmentNotifiedAt = now()`. The pass MUST be idempotent: trips with `destinationAssignmentNotifiedAt IS NOT NULL` MUST be skipped.

#### Scenario: Trip within 72h, no experience assigned, first run

- GIVEN a `CONFIRMED` trip with `startDate` within 72h and `destinationAssignmentNotifiedAt = NULL`
- WHEN the cron fires and Pass 1 runs
- THEN one in-app `Notification` per admin is created, `DestinationAssignmentReminder` email sent to all admins, and `destinationAssignmentNotifiedAt` is stamped

#### Scenario: Same trip on second cron cycle

- GIVEN the same trip now has `destinationAssignmentNotifiedAt IS NOT NULL`
- WHEN Pass 1 runs again
- THEN no new notification or email is created for that trip

#### Scenario: No trips qualify

- GIVEN no `CONFIRMED` trips satisfy the T-72h condition
- WHEN Pass 1 runs
- THEN no notifications are created and the route returns a summary with 0 reminded

---

### Requirement: Pass 2 — T-48h Auto-Reveal

The T-48h pass MUST query all `CONFIRMED` trips where `startDate <= now + 48h` AND `experienceId IS NOT NULL`. For each match it MUST: (a) set `status = REVEALED`; (b) set `destinationRevealedAt = now()`; (c) derive `actualDestination` from `experience.destinationCity + experience.destinationCountry`; (d) send `DestinationRevealed` email to the client. Trips where `experienceId IS NULL` MUST remain `CONFIRMED` and MUST NOT be modified by Pass 2.

#### Scenario: Trip within 48h with experience assigned

- GIVEN a `CONFIRMED` trip with `startDate <= now + 48h` and `experienceId IS NOT NULL`
- WHEN Pass 2 runs
- THEN status becomes `REVEALED`, `destinationRevealedAt` is set, `actualDestination` is derived, and `DestinationRevealed` email is sent

#### Scenario: Trip within 48h without experience assigned

- GIVEN a `CONFIRMED` trip with `startDate <= now + 48h` and `experienceId IS NULL`
- WHEN Pass 2 runs
- THEN the trip is NOT modified and no email is sent

#### Scenario: Late experience assignment — experience added after T-48h already passed

- GIVEN a `CONFIRMED` trip whose `startDate` has elapsed Pass 2 window but which now has `experienceId IS NOT NULL` (admin assigned after deadline)
- WHEN the next cron cycle runs Pass 2
- THEN the trip transitions to `REVEALED` and the client is emailed (no special case; the query condition still matches)

#### Scenario: Idempotency — trip already REVEALED

- GIVEN a trip already in `REVEALED` status
- WHEN Pass 2 runs
- THEN the trip is skipped (query filters `CONFIRMED` only); no duplicate email is sent

---

### Requirement: DestinationAssignmentReminder Email

The system MUST send a `DestinationAssignmentReminder` email to all admin users when Pass 1 fires for a trip. The email MUST include the trip request ID, the client name, the departure date, and a CTA linking to the admin trip management view for that trip. The email MUST be sent in the admin's locale (defaulting to `es`).

#### Scenario: Email content

- GIVEN Pass 1 identifies a qualifying trip
- WHEN the email is dispatched
- THEN it contains: trip ID, client name, departure date, and a CTA URL pointing to the admin trip detail

---

## 2. Delta for 05-client-dashboard

### ADDED Requirements

### Requirement: Reveal Page — Pre-Reveal State

The reveal page `/{locale}/dashboard/trips/[id]/reveal` MUST render when the trip is `CONFIRMED`. It MUST display a countdown to the reveal time (48h before `startDate`). It MUST NOT show the destination. All copy MUST be localized in `es` and `en`.

#### Scenario: Client visits reveal page for a CONFIRMED trip

- GIVEN a `CONFIRMED` trip with `startDate` set
- WHEN the authenticated owner navigates to `/{locale}/dashboard/trips/[id]/reveal`
- THEN a countdown timer is shown and no destination is visible

#### Scenario: Non-owner accesses reveal page

- GIVEN a user who does not own the trip
- WHEN they request `/{locale}/dashboard/trips/[id]/reveal`
- THEN the route returns 404 or redirects to the dashboard (ownership-gated)

---

### Requirement: Reveal Page — Post-Reveal State

The reveal page MUST render a destination hero and a "Ver Itinerario" CTA when the trip is `REVEALED` or `COMPLETED`. The hero MUST show `actualDestination`. The CTA MUST link to `/{locale}/dashboard/trips/[id]/details`. All copy MUST be localized in `es` and `en`.

#### Scenario: Client visits reveal page for a REVEALED trip

- GIVEN a `REVEALED` trip with `actualDestination` set
- WHEN the owner navigates to `/{locale}/dashboard/trips/[id]/reveal`
- THEN the destination hero is shown with `actualDestination` and the "Ver Itinerario" CTA is present

#### Scenario: Client visits reveal page for a COMPLETED trip

- GIVEN a `COMPLETED` trip
- WHEN the owner navigates to `/{locale}/dashboard/trips/[id]/reveal`
- THEN the post-reveal hero is shown (same as REVEALED state)

---

### Requirement: Trip Card Reveal Entry Point

Trip cards in the client dashboard MUST link to `/{locale}/dashboard/trips/[id]/reveal` for trips in `CONFIRMED` or `REVEALED` status. Cards for other statuses MUST NOT link to the reveal page.

#### Scenario: CONFIRMED trip card

- GIVEN a trip card for a `CONFIRMED` trip
- WHEN it is rendered in the Upcoming Trips panel
- THEN the primary CTA links to the reveal page (not the detail page)

#### Scenario: REVEALED trip card

- GIVEN a trip card for a `REVEALED` trip
- WHEN it is rendered in the Upcoming Trips panel
- THEN the primary CTA links to the reveal page

#### Scenario: COMPLETED trip card

- GIVEN a trip card for a `COMPLETED` trip
- WHEN it is rendered
- THEN the primary CTA does NOT link to the reveal page (links to trip detail or review flow)

---

### REMOVED Requirements

### Requirement: Inline Destination Reveal Toggle on Trip Detail

(Reason: replaced by the dedicated reveal page; the inline toggle on `/dashboard/trips/[id]` is dead code once the reveal page exists. The detail page MUST NOT expose a reveal toggle after this change.)

---

## 3. Delta for 06-xsed

### MODIFIED Requirements

### Requirement: DestinationRevealed Email CTA

The `DestinationRevealed` email CTA MUST point to `/{locale}/dashboard/trips/[id]/reveal`. The CTA MUST NOT link to any previous destination reveal page or route.
(Previously: CTA linked to `/reveal-destination` or was unspecified.)

#### Scenario: Reveal email is sent

- GIVEN Pass 2 transitions a trip to `REVEALED`
- WHEN `DestinationRevealed` email is sent
- THEN the CTA URL in the email is `/{locale}/dashboard/trips/{tripId}/reveal`

---

### ADDED Requirements

### Requirement: Dead Code Removal

The system MUST NOT contain the following after this change is applied:

- Route `src/app/[locale]/(secure)/reveal-destination/` and all files under it
- Route handler `src/app/api/bookings/route.ts`
- The path `/reveal-destination` in `secureClientPaths.ts`

#### Scenario: Build passes after removal

- GIVEN the three dead-code items are deleted
- WHEN `npm run build` and `npm run typecheck` run
- THEN both pass with zero errors

#### Scenario: No route references remain

- GIVEN the dead code is removed
- WHEN a grep for `reveal-destination` is run across `src/`
- THEN no references to the deleted route remain in active code

---

## Open Questions / Spec-Level Assumptions

| # | Assumption | Needs confirmation |
|---|------------|--------------------|
| 1 | `BOOKING_CONFIRMED` is reused for the admin reminder notification type. No new `NotificationType` enum value is introduced unless the design phase decides otherwise. | Confirm or add `DESTINATION_ASSIGNMENT_REMINDER` enum value |
| 2 | "All admins" means every `User` with role `ADMIN` in the DB. If admin emails should go to a static `ADMIN_EMAIL` env var only (as in `sendAdminNewBooking`), this changes the email scatter logic. | Clarify: all admin users vs. single env-var address |
| 3 | The reveal page is accessible only to the authenticated trip owner. No public reveal link (i.e., the email CTA requires the client to be logged in). | Confirm no magic-link or unauthenticated reveal path |
| 4 | `actualDestination` on the `TripRequest` is derived from the assigned experience at reveal time, not editable by admin independently after this change. The existing PATCH admin route already does this derivation; the cron reuses the same logic. | Confirm PATCH admin route remains unchanged |
