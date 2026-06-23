# Feature Spec: Booking Flow

**Priority:** 1 — Core revenue path  
**Routes:** `/journey`, `/checkout`, `/checkout/success`, `/checkout/pending`, `/checkout/failure`, `/reveal-destination`  
**Last audited:** 2026-06-22

---

## Status

What works end-to-end today:

- **Journey configurator** — all four tabs (budget, excuse, details, preferences) work. URL-driven state, draft persistence, tripper-curated journeys (`allowedTypes` / `allowedLevelsByType`), and the action bar are fully wired.
- **`POST /api/trip-requests`** — creates or patches a `TripRequest` with full field normalisation, server-authoritative XSED dates, tripper attribution, and paxDetails validation.
- **`POST /api/stripe/payment-intent`** — server-side amount calculation, idempotent intent creation, DB upsert with cancel-on-Stripe-failure guard.
- **Promo code cycle** — `apply-promo` validates against Stripe, recalculates, updates the existing PaymentIntent amount. `remove-promo` resets it. Both are server-authoritative.
- **Webhook + client-side fallback** — webhook handles `succeeded / failed / canceled`. The success page fires `POST /api/stripe/confirm-payment` as a race-safe fallback. Atomic `updateMany` with a status guard prevents double-email if both arrive simultaneously.
- **Post-payment emails** — `BookingConfirmed` → client, `AdminNewBooking` → admin, `PaymentFailed` → client. All fire on the first `APPROVED` transition.
- **Checkout UI** — contact form pre-fills from session, Stripe Elements mounts correctly, pax edit patches the trip and re-creates the intent, promo discount reflected in real time.
- **Success / pending / failure pages** — all exist with correct i18n metadata and Suspense boundaries.

---

## User Flows

**Path A — Standard booking:**
1. Configure on `/journey` (travel type → experience → optional excuse/refine → origin → dates → transport → filters)
2. "View checkout" → auth gate → `POST /api/trip-requests` (status `SAVED`) → redirect to `/checkout?tripId=…`
3. Checkout loads trip via `GET /api/trips`, hydrates contact form from session
4. `POST /api/stripe/payment-intent` fires automatically on trip load
5. User edits contact info; traveler count changes patch the trip and recreate the intent; promo codes update the intent amount
6. On submit: HTML5 validation → `PATCH /api/user/update` → `stripe.confirmPayment()` → redirect to `/checkout/success?payment_intent=…`
7. Success page fires `confirm-payment` fallback + fetches `trip-summary`. Concurrently, webhook sets TripRequest → `CONFIRMED` and sends emails.

**Path B — Payment failure:**
- Stripe 3DS failures return to the success page with `redirect_status=requires_payment_method`, handled inline.
- The dedicated `/checkout/failure` page is never automatically reached.
- `/checkout/pending` is a static screen with no polling.

**Path C — Reveal (stub only):**
- `/reveal-destination?bookingId=…` uses a param name that nothing in the codebase produces. Calls a non-existent external API endpoint. The `REVEALED` status has no trigger.

---

## Gaps

| Severity | Area | Issue |
|----------|------|-------|
| CRITICAL | Reveal page | `RevealDestinationClient` calls `${NEXT_PUBLIC_BACKEND_API_URL}/api/reveal` — does not exist. Mock 5-min countdown. Map is a grey div. Buttons are `console.log`. |
| CRITICAL | Bookings API | `POST /api/bookings` returns a random UUID, writes nothing to the database. |
| HIGH | excuse / refineDetails | Neither field is included in `buildTripRequestPayloadFromSearchParams` or the Prisma schema. Visible in checkout summary but lost on trip creation. Data loss. |
| HIGH | Success page CTA | Primary button links to Stripe receipt URL (`receiptUrl`), not the dashboard. Falls back to `#` if fetch is slow. |
| HIGH | Reveal email | `sendDestinationRevealed` is fully implemented but called nowhere. `REVEALED` status has no trigger in the state machine. |
| MEDIUM | Failure routing | Nothing navigates to `/checkout/failure`. Failure page's retry link is unreachable. |
| MEDIUM | Pending page | No polling or push after async payment methods resolve. Static dead end. |
| MEDIUM | bookingId vs tripRequestId | Reveal page reads `?bookingId` — no route produces this param. Rest of the codebase uses `tripRequestId`. |
| LOW | N+1 query | `GET /api/trips` runs one `payment.findUnique` per trip inside `Promise.all`. Should be a joined query. |
| LOW | Dual trip APIs | `/api/trips` and `/api/trip-requests` both act on `TripRequest` but diverge in field handling. Legacy price-denormalisation fields will drift. |

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| POST | `/api/trip-requests` | Working |
| GET | `/api/trip-requests` | Working |
| GET | `/api/trips` | Working (N+1 perf issue) |
| POST | `/api/trips` | Legacy / overlaps with trip-requests |
| POST | `/api/stripe/payment-intent` | Working |
| POST | `/api/stripe/apply-promo` | Working |
| POST | `/api/stripe/remove-promo` | Working |
| POST | `/api/stripe/confirm-payment` | Working |
| POST | `/api/stripe/webhook` | Working |
| GET | `/api/stripe/trip-summary` | Working |
| POST | `/api/bookings` | **STUB — writes nothing** |
| PATCH | `/api/user/update` | Working |
| GET | (external) `/api/reveal` | **MISSING** |

---

## Next Steps

1. **Fix success page CTA** — replace `receiptUrl` href with `/dashboard`; move receipt to a secondary link. One-line change in `CheckoutResultSuccess.tsx`.
2. **Persist excuse + refineDetails** — add columns to Prisma schema, include in trip-request payload builder, migrate.
3. **Route payment failures correctly** — navigate from `StripePaymentForm` on error; the failure page already handles retry, it just needs to be reached.
4. **Build the real reveal page** — replace `RevealDestinationClient` entirely: switch param to `tripRequestId`, drive countdown from `TripRequest.revealAt`, replace map placeholder, wire share + rebook actions.
5. **Connect success → reveal** — add a "Reveal destination" CTA to the success page (gated on `revealAt`); call `sendDestinationRevealed` from the route that transitions the trip to `REVEALED`.
6. **Add polling to `/checkout/pending`** — short-interval `GET /api/trips/[id]` or server-sent events for async payment methods.
7. **Consolidate dual trip APIs** — migrate checkout loader to `GET /api/trip-requests`, fix N+1 with `include: { payment: true }`, deprecate `/api/trips`.
