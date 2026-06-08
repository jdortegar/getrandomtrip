# Transactional Email Specification

## Purpose

Defines the complete behavior of the transactional email catalogue added to GetRandomTrip. This is a new capability — no prior spec exists for this domain.

---

## Requirements

### Requirement: Centralized Email Service

The system MUST expose a centralized module at `src/lib/email/index.ts` that exports one named async function per email type. All send functions MUST be fire-and-forget: callers MUST NOT await them in the HTTP request path or in the `signIn` auth callback. All send functions MUST swallow errors (catch and `console.error` only). Locale MUST be resolved as `user.locale === "en" ? "en" : "es"` inside each function.

#### Scenario: Fire-and-forget call

- GIVEN a trigger site calls a send function
- WHEN the function is invoked
- THEN the caller does not await the result and the HTTP response is not delayed
- AND any thrown error is caught and logged to console.error only

#### Scenario: Locale fallback

- GIVEN a user record with `locale` set to `null` or `undefined`
- WHEN any send function resolves locale
- THEN `"es"` is used as the resolved locale

---

### Requirement: BookingConfirmed Email (R1)

The system MUST send a BookingConfirmed email to the trip owner when `updatePaymentFromStripeWebhook()` transitions a payment status to APPROVED or COMPLETED. The send MUST be idempotency-gated: if the payment's status is already APPROVED or COMPLETED before the update, no email is sent.

Email content MUST include: booking reference (`tripRequestId`), trip type, number of nights, departure date (if available), and a CTA link to the client dashboard.

#### Scenario: Payment succeeds for the first time

- GIVEN a payment record whose current status is not APPROVED or COMPLETED
- WHEN `updatePaymentFromStripeWebhook()` transitions it to APPROVED or COMPLETED
- THEN a BookingConfirmed email is sent to the trip owner

#### Scenario: Payment already approved (idempotency)

- GIVEN a payment record whose current status is already APPROVED or COMPLETED
- WHEN `updatePaymentFromStripeWebhook()` is called again
- THEN no BookingConfirmed email is sent

#### Scenario: Trip owner not resolvable

- GIVEN the webhook fires but the associated user record is missing
- WHEN the send function is invoked
- THEN the error is swallowed and no exception propagates to the webhook handler

---

### Requirement: PaymentFailed Email (R2)

The system MUST send a PaymentFailed email to the trip owner when the Stripe `payment_intent.payment_failed` webhook event is processed. The email MUST include the failure reason if available and a CTA to retry payment.

#### Scenario: Payment fails

- GIVEN a `payment_intent.payment_failed` event arrives at the Stripe webhook handler
- WHEN the handler processes the event
- THEN a PaymentFailed email is sent to the trip owner

#### Scenario: Missing user

- GIVEN the webhook event references a payment with no resolvable user
- WHEN the send function is invoked
- THEN the error is swallowed gracefully and the webhook handler completes normally

---

### Requirement: DestinationRevealed Email (R3)

The system MUST send a DestinationRevealed email to the trip owner when the admin PATCH `/api/admin/trip-requests/[id]` transitions the trip status to REVEALED. The email MUST include the reveal announcement, destination name (`actualDestination`), trip dates, and a CTA to the client dashboard. The email MUST NOT be sent on any other status transition.

#### Scenario: Status transitions to REVEALED

- GIVEN an admin PATCH request sets the trip status to REVEALED
- WHEN the route handler processes the update
- THEN a DestinationRevealed email is sent to the trip owner

#### Scenario: Other status transition

- GIVEN an admin PATCH sets the status to any value other than REVEALED
- WHEN the route handler processes the update
- THEN no DestinationRevealed email is sent

---

### Requirement: TripCancelled Email (R4)

The system MUST send a TripCancelled email to the trip owner when the admin PATCH transitions the trip status to CANCELLED. The email MUST include a cancellation notice and a support CTA.

#### Scenario: Status transitions to CANCELLED

- GIVEN an admin PATCH sets the trip status to CANCELLED
- WHEN the route handler processes the update
- THEN a TripCancelled email is sent to the trip owner

#### Scenario: Other status transition

- GIVEN an admin PATCH sets the status to any value other than CANCELLED
- WHEN the route handler processes the update
- THEN no TripCancelled email is sent

---

### Requirement: TripCompleted Email (R5)

The system MUST send a TripCompleted email to the trip owner when the admin PATCH transitions the trip status to COMPLETED. The email MUST include a completion celebration message and a review request CTA to the client dashboard.

#### Scenario: Status transitions to COMPLETED

- GIVEN an admin PATCH sets the trip status to COMPLETED
- WHEN the route handler processes the update
- THEN a TripCompleted email is sent to the trip owner

---

### Requirement: ExperienceSubmitted Email (R6)

The system MUST send an ExperienceSubmitted email to the admin address (`process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com"`) when a tripper's experience submission successfully transitions to PENDING_REVIEW via `/api/tripper/experiences/[id]/submit/route.ts`. The email MUST include the tripper's name, the experience title, and a link to the admin review page. The email MUST NOT be sent if the submission fails validation.

#### Scenario: Experience successfully submitted

- GIVEN a tripper submits an experience and the transition to PENDING_REVIEW succeeds
- WHEN the submit route handler completes
- THEN an ExperienceSubmitted email is sent to the admin address

#### Scenario: Submission fails validation

- GIVEN the experience does not pass server-side validation
- WHEN the submit route handler returns an error response
- THEN no ExperienceSubmitted email is sent

---

### Requirement: WelcomeEmail (R7)

The system MUST send a WelcomeEmail to a new user's email address when the Google OAuth `signIn` callback in `src/lib/auth.ts` executes the `!dbUser` branch (first-time sign-in only). The email MUST include a welcome message, a platform introduction, and a CTA to start planning a trip. The email MUST NOT be sent on subsequent logins by the same user.

#### Scenario: First OAuth sign-in (new user)

- GIVEN a Google OAuth signIn callback fires and `dbUser` is null/undefined
- WHEN the `!dbUser` branch executes
- THEN a WelcomeEmail is sent to the new user's email

#### Scenario: Returning user login

- GIVEN a Google OAuth signIn callback fires and `dbUser` already exists
- WHEN the callback executes
- THEN no WelcomeEmail is sent

---

### Requirement: React Email Templates

The system MUST include one React Email template per email type in `src/emails/`. Each template MUST support bilingual rendering (ES/EN) following the pattern of `ExperienceApproved.tsx`, with a `subjects` named export.

#### Scenario: Template renders for each locale

- GIVEN a template is rendered with `locale = "en"`
- WHEN the template function executes
- THEN the subject and body copy appear in English

- GIVEN a template is rendered with `locale = "es"`
- WHEN the template function executes
- THEN the subject and body copy appear in Spanish

---

### Requirement: Test Script Registration (R9)

All 7 new email templates MUST be registered in `scripts/send-test-email.ts` so each can be previewed and sent to a test recipient without triggering real application flows.

#### Scenario: All templates selectable

- GIVEN the test script is run
- WHEN any of the 7 new template keys is selected
- THEN the script renders and sends the template to the configured test recipient without error
