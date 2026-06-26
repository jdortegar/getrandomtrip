# Trip Booking / Client Journey

**Status**: Partial
**Priority**: High

## Purpose

The core booking flow that lets a client configure a mystery trip through a multi-step wizard and proceed to checkout. The client specifies budget, occasion, travel details, and preferences; the system persists a TripRequest and drives them to payment. Post-checkout pages handle success, failure, and pending states.

## What's Implemented

- Journey wizard (`/journey`) with 4 tabs: budget, excuse, details, preferences; draft saved to session storage
- `POST /api/trip-requests` creates or updates a TripRequest with all filter and logistics fields
- Checkout page: trip display, promo code application (Stripe), and payment intent creation
- Post-checkout pages: success (`/confirm-payment`), failure, and pending
- Pax editing at checkout

## Gaps

- [ ] `/api/bookings/route.ts` is a pure stub — returns a random UUID and does nothing; it is never called by the checkout flow and must be implemented or removed
- [ ] Add-ons step is gated behind a disabled feature flag (`JOURNEY_ADDONS_ENABLED`) — no UI or API for add-ons
- [ ] No "edit trip request" flow from the checkout page — going back re-enters the wizard from scratch instead of restoring state
- [ ] `/reveal-destination` calls a non-existent external backend API and contains a "Map Integration Placeholder" comment — not connected to real data
- [ ] No direct confirmation email sent from checkout success — depends entirely on the Stripe webhook being registered in the environment

## Out of Scope

- Real-time trip pricing engine (price is set by the tripper on the experience)
- Group booking splits or shared payment links
