# Tripper OS

**Status**: Partial
**Priority**: Medium

## Purpose

The operational back-office for trippers. Trippers use this area to manage their experience catalog, track bookings and earnings, read client reviews, publish blog content, and respond to in-app notifications. Access is gated by `TripperGuard`.

## What's Implemented

- Dashboard with stats grid and recent bookings via `/api/tripper/dashboard`
- Experiences list (server-rendered) with create and edit multi-step form
- Experience submit for review — sets status to PENDING_REVIEW and sends email to admin
- Earnings: current period totals, 6-month history table, and CSV export
- Reviews: average rating, NPS, promoter/detractor breakdown, individual review cards
- Notifications inbox (TRIPPER audience)
- Unread dot on navbar and nav tabs
- Blog authoring: create, edit, and preview

## Gaps

- [ ] No way to re-submit a rejected experience — the submit endpoint requires DRAFT status; it is unclear whether the reject route resets status back to DRAFT
- [ ] No earnings payout request or payout history
- [ ] No experience deletion from the Tripper OS UI
- [ ] No preview of how an experience listing card looks on the public catalog
- [ ] Experience rejection → re-submit flow is not clearly defined in the UI or API

## Out of Scope

- Tripper-to-client direct messaging
- Custom earnings withdrawal methods beyond payout request
- Analytics beyond the current NPS and rating breakdown
