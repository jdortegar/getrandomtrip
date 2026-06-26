# In-App Notifications

**Status**: Partial
**Priority**: Medium

## Purpose

Surfaces system events as in-app messages for both clients and trippers. Trippers have a dedicated inbox and an unread indicator in the nav. Clients see a sidebar panel on their dashboard. Notifications complement transactional emails for time-sensitive events.

## What's Implemented

- `GET /api/notifications` with audience filter (CLIENT / TRIPPER)
- `POST /api/notifications/[id]/read` to mark a single notification as read
- `GET /api/notifications/unread-count` (TRIPPER audience only)
- `TripperUnreadDot` component on navbar and nav tabs
- Tripper notifications inbox page in Tripper OS
- Client `NotificationsPanel` on the dashboard sidebar
- Notifications emitted for: experience approved, experience rejected

## Gaps

- [ ] No CLIENT unread indicator — no unread-count endpoint for clients, no UI dot or badge
- [ ] Only 2 notification emit points exist — booking confirmed, payment failed, destination revealed, trip cancelled, and trip completed fire emails only; no in-app notification is created for these events
- [ ] No real-time polling — the inbox loads once on mount with no refresh interval
- [ ] No admin broadcast mechanism to send a notification to all users or a segment
- [ ] No per-user notification preferences — users cannot opt out of specific notification types

## Out of Scope

- Push notifications (web push / mobile)
- WebSocket real-time delivery
- Notification grouping or threading
