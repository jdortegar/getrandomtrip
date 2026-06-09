# Transactional Emails

**Status**: Partial
**Priority**: Medium

## Purpose

Automated emails triggered by system events — registration, booking, payment, destination reveal, and experience lifecycle. All templates are bilingual (es/en) and share a common layout. Centralized dispatch functions in `lib/email/index.ts` keep sending logic consistent.

## What's Implemented

- 10 React Email templates: `WelcomeEmail`, `BookingConfirmed`, `PaymentFailed`, `DestinationRevealed`, `TripCancelled`, `TripCompleted`, `ExperienceSubmitted`, `ExperienceApproved`, `ExperienceRejected`, `NewsletterGoLive`, `XsedCampaign`
- All templates bilingual, wrapped in shared `EmailLayout`
- Centralized `lib/email/index.ts` with fire-and-forget send functions
- Trigger coverage: welcome, booking confirmation, payment outcomes, destination reveal, trip cancel/complete, experience submit/approve/reject

## Gaps

- [ ] `ExperienceApproved` and `ExperienceRejected` are triggered inline in route handlers instead of through `lib/email/index.ts` — inconsistent with the centralized pattern
- [ ] `NewsletterGoLive` and `XsedCampaign` templates have no dispatch code — they can only be sent manually
- [ ] Newsletter signup (`/api/newsletter`) has a `TODO: integrar con ESP` comment — not wired to any email service provider
- [ ] No password reset email template
- [ ] No reminder emails — trip approaching, destination reveal imminent
- [ ] No post-trip review request email
- [ ] XSED notification email is inline HTML, not a React Email template — inconsistent and harder to maintain

## Out of Scope

- Marketing campaign emails (beyond the existing campaign templates)
- Email preference center per user
- Bounce and unsubscribe webhook handling from the ESP
