# Payments

**Status**: Partial
**Priority**: High

## Purpose

Handles payment collection for trip bookings. Stripe is the sole payment provider.

## What's Implemented

- Stripe PaymentIntent creation — idempotent, amount computed server-side
- Stripe 3DS redirect and confirm-payment flow
- Stripe webhook handling: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled` → updates Payment row and fires transactional emails
- Promo code apply/remove via Stripe promotion codes API
- `GET /api/payments` returns the authenticated user's payment history

## Gaps

- [ ] No refund route or logic — no Stripe refund API call, no admin-triggered refund action
- [ ] Promo code discount amount is not persisted to the Payment DB row — no record of which promo was used or its value
- [ ] No payment receipt PDF or downloadable invoice for clients
- [ ] Webhook does not handle `charge.refunded` or `payment_intent.requires_action` events

## Out of Scope

- Crypto or alternative payment rails
- Split payments between multiple clients for one booking
- Subscription or recurring billing
