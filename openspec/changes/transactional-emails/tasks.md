# Tasks: Transactional Emails — Complete the Catalogue

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600–650 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation + templates) → PR 2 (trigger wiring) → PR 3 (test script + QA) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Email service + all 7 templates | PR 1 | Base: `develop`; purely additive, no existing files touched |
| 2 | Wire all 4 trigger sites | PR 2 | Base: PR 1 branch; modifies `payment.ts`, admin PATCH, submit, `auth.ts` |
| 3 | Test script + typecheck + QA | PR 3 | Base: PR 2 branch; registers 7 templates in `send-test-email.ts` |

---

## Phase 1: Foundation — Email Service (PR 1)

- [x] 1.1 Create `src/lib/email/index.ts` with all 7 named async function signatures as stubs (try/catch wrappers, empty bodies); import `sendMail` from `@/lib/helpers/sendMail`; verify `npm run typecheck` passes
- [x] 1.2 Implement `sendBookingConfirmed(tripRequestId, userId)`: fetch `Payment` + `User`, resolve locale, render `BookingConfirmed`, call `sendMail` — leave template import as TODO until 2.x
- [x] 1.3 Implement `sendPaymentFailed(tripRequestId, userId)`: same pattern; fetch failure reason from `Payment.failureReason` if available
- [x] 1.4 Implement `sendDestinationRevealed(tripRequestId, userId)`: fetch `TripRequest.actualDestination`, `departureDate`, render template
- [x] 1.5 Implement `sendTripCancelled(tripRequestId, userId)`: fetch trip basics, render template
- [x] 1.6 Implement `sendTripCompleted(tripRequestId, userId)`: fetch trip basics, render template
- [x] 1.7 Implement `sendExperienceSubmitted(experienceId, tripperId)`: fetch `Experience.title` + tripper `name`; `to: process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com"`; locale hardcoded `"es"`
- [x] 1.8 Implement `sendWelcomeEmail(userId)`: fetch `User.email` + `name`, resolve locale, render template

## Phase 2: Templates (PR 1, parallel with Phase 1 stubs)

- [x] 2.1 Create `src/emails/BookingConfirmed.tsx`: mirror `ExperienceApproved.tsx` structure; props `{ client, tripRequestId, tripType, nights, departureDate?, locale }`; `subjects` export ES/EN; CTA → `/${locale}/dashboard`
- [x] 2.2 Create `src/emails/PaymentFailed.tsx`: props `{ client, tripRequestId, failureReason?, locale }`; `subjects` ES/EN; CTA → checkout retry URL `/${locale}/journey`
- [x] 2.3 Create `src/emails/DestinationRevealed.tsx`: props `{ client, destination, departureDate?, returnDate?, locale }`; `subjects` ES/EN; CTA → `/${locale}/dashboard`
- [x] 2.4 Create `src/emails/TripCancelled.tsx`: props `{ client, tripRequestId, locale }`; `subjects` ES/EN; CTA → support email or `/${locale}/dashboard`
- [x] 2.5 Create `src/emails/TripCompleted.tsx`: props `{ client, locale }`; `subjects` ES/EN; CTA → `/${locale}/dashboard` (review request)
- [x] 2.6 Create `src/emails/ExperienceSubmitted.tsx`: props `{ tripperName, experienceTitle, experienceId }`; Spanish only; `subjects = { es: "...", en: "..." }` (en can mirror es); CTA → admin review URL `/es/admin/experiences/${experienceId}`
- [x] 2.7 Create `src/emails/WelcomeEmail.tsx`: props `{ name, locale }`; `subjects` ES/EN; CTA → `/${locale}/journey` (start booking)
- [x] 2.8 Wire template imports into each send function in `src/lib/email/index.ts`; run `npm run typecheck`

## Phase 3: Trigger Wiring (PR 2)

- [x] 3.1 Modify `src/lib/db/payment.ts` — in `updatePaymentFromStripeWebhook`, capture `const priorStatus = payment.status` before the update; inside the `APPROVED` block, add `if (priorStatus !== "APPROVED" && priorStatus !== "COMPLETED") { void sendBookingConfirmed(payment.tripRequestId, payment.userId); }` (satisfies R1 idempotency spec)
- [x] 3.2 Modify `src/lib/db/payment.ts` — add `void sendPaymentFailed(payment.tripRequestId, payment.userId)` in the `FAILED` branch (satisfies R2); confirm PaymentFailed is NOT also triggered in webhook route
- [x] 3.3 Modify `src/app/api/admin/trip-requests/[id]/route.ts` — after `prisma.tripRequest.update`, branch on `nextStatus`: `case "REVEALED": void sendDestinationRevealed(...)`, `case "CANCELLED": void sendTripCancelled(...)`, `case "COMPLETED": void sendTripCompleted(...)` (satisfies R3/R4/R5)
- [x] 3.4 Modify `src/app/api/tripper/experiences/[id]/submit/route.ts` — after PENDING_REVIEW update succeeds, add `void sendExperienceSubmitted(experience.id, session.user.id)` (satisfies R6); must be AFTER early-return validation guards
- [x] 3.5 Modify `src/lib/auth.ts` — inside `if (account?.provider === "google" && !dbUser)` branch, after `prisma.user.create` resolves to `dbUser`, add `void sendWelcomeEmail(dbUser.id)` (satisfies R7)
- [x] 3.6 Run `npm run typecheck` — must pass with zero errors across all modified files

## Phase 4: Test Script + Verification (PR 3)

- [ ] 4.1 Modify `scripts/send-test-email.ts` — add imports for all 7 new templates and their `subjects` exports
- [ ] 4.2 Register all 7 in the `templates` map with representative sample props covering at least one locale each (ES preferred for most, EN for at least `WelcomeEmail` and `BookingConfirmed`)
- [ ] 4.3 Run `npx tsx scripts/send-test-email.ts` (no args) and confirm all 7 new keys appear in the listed templates
- [ ] 4.4 Run `npx tsx scripts/send-test-email.ts BookingConfirmed` and `npx tsx scripts/send-test-email.ts WelcomeEmail` — confirm emails arrive at test recipient
- [ ] 4.5 Integration check — trigger BookingConfirmed idempotency: call `updatePaymentFromStripeWebhook` twice with APPROVED event; confirm second call does NOT send a duplicate (check console, not email inbox)
- [ ] 4.6 Integration check — admin PATCH to REVEALED: confirm `DestinationRevealed` fires; PATCH to CANCELLED confirms `TripCancelled`; PATCH to COMPLETED confirms `TripCompleted`; no email on other transitions
- [ ] 4.7 Run `npm run lint` — no new violations; run `npm run typecheck` — zero errors
