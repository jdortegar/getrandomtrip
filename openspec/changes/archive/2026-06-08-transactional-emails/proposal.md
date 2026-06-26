# Proposal: Transactional Emails — Complete the Catalogue

## Intent

The platform sends emails only for experience approve/reject. The entire client lifecycle — payment success, payment failure, destination reveal, completion, cancellation, welcome — is silent. Money changes hands and trips are revealed with no email. This change closes the P1/P2 gap and centralizes email send logic so future emails stay trivial to add.

## Scope

### In Scope
- New centralized email service `src/lib/email/index.ts` with one named async function per email.
- 7 emails: P1 `BookingConfirmed`, `PaymentFailed`; P2 `DestinationRevealed`, `TripCancelled`, `TripCompleted`, `ExperienceSubmitted` (to admin), `WelcomeEmail`.
- React Email templates in `src/emails/` following the `ExperienceApproved.tsx` pattern (bilingual ES/EN, named `subjects` export).
- Wire triggers at existing event sites (payment webhook, admin PATCH, experience submit, OAuth signIn).
- Register all new templates in `scripts/send-test-email.ts`.

### Out of Scope
- P3 emails: trip reminders, post-trip review requests, tripper earnings summaries.
- Payment refunded email and newsletter confirmation (upstream ESP integration is a stub).
- Credentials-signup welcome path (only Google OAuth `!dbUser` branch in scope).
- Changes to in-app `Notification` model behavior.

## Capabilities

### New Capabilities
- `transactional-email`: Centralized send service and the catalogue of lifecycle emails — triggers, locale resolution, idempotency, and fire-and-forget delivery contract.

### Modified Capabilities
- None.

## Approach

Adopt exploration Option B (centralized service). Each `src/lib/email/index.ts` function resolves locale (`user.locale ?? "es"`), renders its template, and calls `sendMail` fire-and-forget via the established `void (async () => { try { await sendMail(...) } catch (err) { console.error('[email]', err) } })()` pattern. Routes import from `@/lib/email`; no inline template logic in routes. Templates mirror `ExperienceApproved.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/email/index.ts` | New | Service layer, one fn per email |
| `src/emails/*.tsx` | New | 7 React Email templates |
| `src/lib/db/payment.ts` | Modified | `BookingConfirmed` on CONFIRMED, idempotency-gated |
| Stripe webhook route | Modified | `PaymentFailed` on `payment_intent.payment_failed` |
| `src/app/api/admin/trip-requests/[id]/route.ts` | Modified | Reveal / Completed / Cancelled per-status branch |
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Modified | `ExperienceSubmitted` to `ADMIN_EMAIL` |
| `src/lib/auth.ts` | Modified | `WelcomeEmail` in `!dbUser` branch |
| `scripts/send-test-email.ts` | Modified | Register 7 templates |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Double BookingConfirmed (webhook + confirm route) | High | Gate: send only if `payment.status` not already APPROVED/COMPLETED pre-update |
| Welcome fires on every login | Med | Only inside `!dbUser` branch of signIn callback |
| Email send blocks HTTP response | Med | Fire-and-forget everywhere; never `await` in request path |
| Admin PATCH multi-transition mis-fire | Med | Per-status branching keyed on the new status |

## Rollback Plan

Service is additive. Revert by removing `@/lib/email` imports at the trigger sites (payment.ts, webhook, admin PATCH, submit route, auth.ts). Templates and `src/lib/email/index.ts` can stay dormant with no callers. No schema or data migration involved.

## Dependencies

- Resend (`RESEND_API_KEY`), `EMAIL_FROM`, existing `src/lib/helpers/sendMail.ts`.
- `ADMIN_EMAIL` env (fallback `hola@getrandomtrip.com`) for `ExperienceSubmitted`.

## Success Criteria

- [ ] All 7 emails send on their real triggers in ES and EN.
- [ ] BookingConfirmed never sends twice for one payment.
- [ ] WelcomeEmail only on new-user OAuth sign-in.
- [ ] No trigger blocks its HTTP response.
- [ ] All 7 templates render via `scripts/send-test-email.ts`.
