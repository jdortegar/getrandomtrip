# Stripe Migration Design

**Date:** 2026-04-26
**Status:** Approved

## Overview

Replace MercadoPago with Stripe as the sole payment provider. Use Stripe Elements (embedded) so the payment form lives inside the existing `/checkout` page — no redirect to a hosted payment page.

---

## Checkout Flow

1. User fills the checkout form on `/checkout`
2. On submit, frontend calls `POST /api/stripe/payment-intent` → receives `{ clientSecret, paymentIntentId }`
3. `<Elements>` wrapper and `<StripePaymentForm>` are rendered inline with the `clientSecret`
4. User enters card details and clicks "Pay" → `stripe.confirmPayment()` runs client-side
5. On success, Stripe sends a `payment_intent.succeeded` event to `POST /api/stripe/webhook`
6. Webhook sets `Payment.status = APPROVED` and `TripRequest.status = CONFIRMED`
7. For 3DS cards, Stripe redirects to `/checkout/success?payment_intent=...&redirect_status=succeeded` — the success page reads these params and displays confirmation

---

## API Routes

### New

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/stripe/payment-intent` | Authenticated. Creates a Stripe `PaymentIntent` for the trip. Upserts the `Payment` row in DB. Returns `{ clientSecret, paymentIntentId }`. |
| POST | `/api/stripe/webhook` | Verifies Stripe signature via `STRIPE_WEBHOOK_SECRET`. Must read raw body with `request.text()` (not `request.json()`) before calling `stripe.webhooks.constructEvent()`. Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`. Updates `Payment` status and sets `TripRequest.status = CONFIRMED` on success. |

### Deleted

- `POST /api/mercadopago/preference`
- `POST /api/mercadopago/webhook`
- `POST /api/payments/confirm`
- `POST /api/payments/mercadopago/checkout-return`

### Unchanged

- `GET /api/payments` (admin listing)
- `GET /api/admin/payments`

---

## Frontend

### `src/hooks/usePayment.ts`

- Replace `initiatePayment()` with `createPaymentIntent(tripId): Promise<{ clientSecret: string }>` — calls `/api/stripe/payment-intent`, returns the client secret.
- `isProcessing` state stays.
- Remove all MercadoPago-specific logic.

### `src/app/[locale]/(secure)/checkout/page.tsx`

- On form submit: call `createPaymentIntent(trip.id)`, store `clientSecret` in local state.
- When `clientSecret` is set, render `<Elements stripe={stripePromise} options={{ clientSecret }}>` wrapping a new `<StripePaymentForm>`.
- `stripePromise` is initialized once via `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`.

### New: `src/components/app/checkout/StripePaymentForm.tsx`

- Renders `<PaymentElement />` + "Pay" submit button.
- Calls `stripe.confirmPayment({ confirmParams: { return_url: .../checkout/success } })`.
- Handles loading and error states inline (display error message below the form).

### `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx`

- Remove all MP param parsing (`parseMercadoPagoCheckoutReturnParams`, `persistMercadoPagoCheckoutReturnParams`, `confirmMercadoPagoPaymentFromReturnParams`).
- For 3DS returns: read `payment_intent` and `redirect_status` from URL search params. If `redirect_status === 'succeeded'`, show success. If `failed`, show error.

### `src/app/[locale]/(secure)/checkout/CheckoutResultPending.tsx` and `CheckoutResultFailure.tsx`

- Strip MP-specific param handling. Keep generic UI.

### Deleted Files

- `src/lib/helpers/confirm-mercadopago-payment-from-return.ts`
- `src/lib/helpers/persist-mercadopago-checkout-return.ts`
- `src/lib/types/MercadoPagoCheckoutReturnParams.ts`
- `src/lib/helpers/mercadopago-checkout-params.ts`

---

## Database Schema

### `Payment` model

**Add:**
```prisma
stripePaymentIntentId String? @unique
```

**Remove:**
```prisma
mpExternalReference     String?
mpDescription           String?
mpStatementDescriptor   String?
providerPreferenceId    String?
```

**Keep:**
- `providerPaymentId` — holds the Stripe PaymentIntent ID for generic lookup via `findPaymentByProviderId()`
- All status fields and the full `PaymentStatus` enum (values are provider-agnostic)

**Migration:** `prisma migrate dev` — drop MP columns, add `stripePaymentIntentId`. No backfill needed.

### `src/lib/db/payment.ts`

- Remove `upsertPaymentForTripCheckout` MP-specific fields from create/update payloads.
- Remove `findPaymentForMercadoPagoResource()` and `mergeCheckoutReturnIntoProviderResponse()`.
- Add `findPaymentByStripePaymentIntentId(id: string)` for webhook lookup.
- `updatePaymentFromWebhook` becomes `updatePaymentFromStripeEvent` — maps Stripe PaymentIntent status to `PaymentStatus`.

---

## Packages

### Add
- `stripe` — server-side Node SDK
- `@stripe/stripe-js` — client-side Stripe.js loader
- `@stripe/react-stripe-js` — React components (`Elements`, `PaymentElement`)

### Remove
- `mercadopago`

---

## Environment Variables

### Add
```
STRIPE_SECRET_KEY                    # sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET                # whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   # pk_live_... or pk_test_...
```

### Remove
```
MERCADOPAGO_TEST_ACCESS_TOKEN
MERCADOPAGO_TEST_PUBLIC_KEY
MERCADOPAGO_LIVE_ACCESS_TOKEN
```

---

## Files Touched Summary

| Action | Path |
|--------|------|
| Create | `src/app/api/stripe/payment-intent/route.ts` |
| Create | `src/app/api/stripe/webhook/route.ts` |
| Create | `src/components/app/checkout/StripePaymentForm.tsx` |
| Edit | `src/hooks/usePayment.ts` |
| Edit | `src/app/[locale]/(secure)/checkout/page.tsx` |
| Edit | `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx` |
| Edit | `src/app/[locale]/(secure)/checkout/CheckoutResultPending.tsx` |
| Edit | `src/app/[locale]/(secure)/checkout/CheckoutResultFailure.tsx` |
| Edit | `src/lib/db/payment.ts` |
| Edit | `prisma/schema.prisma` |
| Delete | `src/app/api/mercadopago/preference/route.ts` |
| Delete | `src/app/api/mercadopago/webhook/route.ts` |
| Delete | `src/app/api/payments/confirm/route.ts` |
| Delete | `src/app/api/payments/mercadopago/checkout-return/route.ts` |
| Delete | `src/lib/helpers/confirm-mercadopago-payment-from-return.ts` |
| Delete | `src/lib/helpers/persist-mercadopago-checkout-return.ts` |
| Delete | `src/lib/types/MercadoPagoCheckoutReturnParams.ts` |
| Delete | `src/lib/helpers/mercadopago-checkout-params.ts` |
