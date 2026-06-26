# XSED / Drops

**Status**: Partial
**Priority**: Medium

## Purpose

XSED is a flash-sale product line where curated trip drops are sold during a fixed weekly booking window (Sundays 4–8 pm). Clients sign up for notifications, browse drops, and book during the window. Admins create and manage drops. This feature operates semi-independently from the main journey booking flow.

## What's Implemented

- XSED landing page: hero, countdown, drop grid, FAQ, and testimonials
- Drops listing with infinite scroll grid
- Drop detail page: hero, article body (hotels and activities), gallery carousel, and testimonials
- Book page with time-window gate (Sunday 4–8 pm) and admin bypass
- Admin: create and edit drops; manage XSED notification signups
- Notification signup endpoint and cron endpoint that sends "window opens in 30 min" emails

## Gaps

- [ ] `XsedBookClient` booking form has not been fully audited — unclear whether it creates a TripRequest and a Stripe PaymentIntent
- [ ] No cancellation or refund flow for XSED purchasers
- [ ] Drop detail pages have no CTA to book — they are retrospective-only and do not link to the booking page
- [ ] Unsubscribe link in the XSED notification email points to the landing page, not a real unsubscribe endpoint

## Out of Scope

- Multiple booking windows per week
- Drop inventory or capacity limiting beyond manual admin management
