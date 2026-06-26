# Client Dashboard

**Status**: Partial
**Priority**: High

## Purpose

The post-login home for clients. Displays trip statistics, surfaces unpaid and upcoming trips, shows in-app notifications, and provides access to trip detail pages. Role-aware: tripper users are redirected to `/dashboard/tripper`.

## What's Implemented

- Dashboard with 5 stat cards: total trips, upcoming, completed, total spent, average rating
- Unpaid trips panel with delete action
- Upcoming trips panel and all-paid trips grid
- Notifications sidebar panel (CLIENT audience)
- Trip detail page: logistics, filters, add-ons, pricing breakdown, payment info, status timeline
- Destination reveal toggle on trip detail when status is REVEALED or COMPLETED
- Role redirect: tripper users sent to `/dashboard/tripper`

## Gaps

- [ ] "Leave Review" button links to `/dashboard/trips/[id]/details` — that route does not exist; no review form and no review API for clients
- [ ] No CLIENT unread notification indicator — the unread dot exists only for TRIPPER audience; clients have no visual cue for unread notifications
- [ ] `/reveal-destination` is a disconnected prototype not linked from the dashboard
- [ ] "Ver Itinerario" links to non-existent `/dashboard/trips/[id]/details`
- [ ] No pagination on the all-trips grid

## Out of Scope

- Client-to-tripper messaging
- Trip document storage (itineraries, vouchers)
