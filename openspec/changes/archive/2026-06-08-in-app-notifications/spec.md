# In-App Notifications Specification

## Purpose

Define the complete behavior of the read-only in-app notification system: persistent per-user records, a three-endpoint REST API, audience-scoped rendering surfaces (tripper page, client dashboard panel, unread avatar dot), and the emit contract tied to experience approval/rejection.

---

## Requirements

### Requirement: Notification Data Model

The system MUST persist a `Notification` record with fields: `id` (cuid), `userId`, `type` (NotificationType), `audience` (NotificationAudience), `isRead` (default false), `title`, `body` (optional), `metadata` (Json, optional), `createdAt`. The `User` model MUST have a `notifications` relation with `onDelete: Cascade`. Indexes MUST cover `[userId, isRead]` and `[userId, createdAt]`.

#### Scenario: Record created on approval

- GIVEN an experience is approved by an admin
- WHEN the approve route executes
- THEN a `Notification` row exists for the experience owner with `type = EXPERIENCE_APPROVED`, `audience = TRIPPER`, `isRead = false`

#### Scenario: Record created on rejection

- GIVEN an experience is rejected with a review note
- WHEN the reject route executes
- THEN a `Notification` row exists for the experience owner with `type = EXPERIENCE_REJECTED`, `audience = TRIPPER`, `body` containing the review note

#### Scenario: Cascade delete

- GIVEN a user account is deleted
- WHEN the deletion is committed
- THEN all associated `Notification` rows are removed automatically

---

### Requirement: NotificationType Enum

The system MUST define `NotificationType` with values: `EXPERIENCE_APPROVED`, `EXPERIENCE_REJECTED`, `BOOKING_CONFIRMED`, `BOOKING_REVEALED`, `BOOKING_COMPLETED`, `BOOKING_CANCELLED`, `PAYMENT_RECEIVED`. Only `EXPERIENCE_APPROVED` and `EXPERIENCE_REJECTED` MUST be emitted in v1; remaining values are reserved.

#### Scenario: Reserved types not emitted

- GIVEN v1 is running
- WHEN any booking or payment event occurs
- THEN no `Notification` record is created for `BOOKING_*` or `PAYMENT_RECEIVED` types

---

### Requirement: NotificationAudience Enum

The system MUST define `NotificationAudience` with values: `CLIENT` and `TRIPPER`. Every notification MUST carry exactly one audience value.

---

### Requirement: List API

`GET /api/notifications` MUST return the authenticated user's notifications sorted by `createdAt` descending as `{ notifications: Notification[] }`. The endpoint MUST return HTTP 401 when no valid session exists. No pagination is required in v1.

#### Scenario: Authenticated list

- GIVEN a user has 3 notifications
- WHEN `GET /api/notifications` is called with a valid session
- THEN HTTP 200 is returned with all 3 notifications, newest first

#### Scenario: Unauthenticated list

- GIVEN no session cookie is present
- WHEN `GET /api/notifications` is called
- THEN HTTP 401 is returned

#### Scenario: Cross-user isolation

- GIVEN user A and user B both have notifications
- WHEN user A calls `GET /api/notifications`
- THEN only user A's notifications are returned

---

### Requirement: Mark-Read API

`PATCH /api/notifications/[id]/read` MUST set `isRead = true` for the specified notification and return `{ notification: Notification }`. The endpoint MUST return HTTP 401 with no session, HTTP 404 if the notification does not exist or belongs to a different user.

#### Scenario: Successful mark-read

- GIVEN a notification with `isRead = false` belonging to the authenticated user
- WHEN `PATCH /api/notifications/[id]/read` is called
- THEN HTTP 200 is returned with `notification.isRead = true`

#### Scenario: Wrong owner

- GIVEN a notification belonging to user B
- WHEN user A calls `PATCH /api/notifications/[id]/read`
- THEN HTTP 404 is returned and `isRead` remains unchanged

---

### Requirement: Unread Count API

`GET /api/notifications/unread-count` MUST return `{ count: number }` representing the authenticated user's unread notification count. The endpoint MUST return HTTP 401 when no valid session exists.

#### Scenario: Authenticated count

- GIVEN a user has 2 unread notifications
- WHEN `GET /api/notifications/unread-count` is called with a valid session
- THEN HTTP 200 is returned with `{ count: 2 }`

#### Scenario: All read

- GIVEN all of the user's notifications are read
- WHEN `GET /api/notifications/unread-count` is called
- THEN HTTP 200 is returned with `{ count: 0 }`

---

### Requirement: Tripper Notifications Page

The route `/{locale}/dashboard/tripper/notifications` MUST render all notifications with `audience = TRIPPER` for the authenticated tripper, sorted newest first. Each item MUST display: title, body (when present), relative timestamp, and a visual distinction between read and unread. Clicking an unread item MUST call `PATCH /api/notifications/[id]/read` and update its visual state. An empty state with localized copy MUST be shown when no notifications exist.

#### Scenario: Notifications listed

- GIVEN the tripper has 2 notifications
- WHEN they navigate to the notifications page
- THEN both items appear, newest first, with unread items visually distinct

#### Scenario: Mark read on click

- GIVEN an unread notification item
- WHEN the user clicks it
- THEN the item transitions to read visual state and `isRead` is true on the server

#### Scenario: Empty state

- GIVEN the tripper has no notifications
- WHEN they navigate to the notifications page
- THEN a localized "no notifications yet" message is displayed

---

### Requirement: Tripper Avatar Unread Dot

A small indicator on the tripper layout nav avatar MUST be visible when the authenticated tripper's unread count is greater than zero. The count MUST be fetched on mount via `GET /api/notifications/unread-count`. On error, the dot MUST be hidden (fail-silent). The indicator MUST be rendered in a dedicated client subcomponent that does not affect static nav rendering.

#### Scenario: Dot visible

- GIVEN the tripper has 1 unread notification
- WHEN the tripper layout renders
- THEN the avatar dot is visible

#### Scenario: Dot hidden on zero

- GIVEN all notifications are read
- WHEN the tripper layout renders
- THEN no avatar dot is visible

#### Scenario: Dot hidden on error

- GIVEN the unread-count API returns a non-2xx response
- WHEN the tripper layout renders
- THEN no avatar dot is visible and no error UI is shown

---

### Requirement: Client Notifications Panel

A `NotificationsPanel` widget MUST be added to the client dashboard grid. It MUST render the authenticated client's notifications. Clicking an item MUST mark it as read. An empty state MUST be shown when no notifications exist.

#### Scenario: Panel renders notifications

- GIVEN a client has notifications
- WHEN the client dashboard loads
- THEN the `NotificationsPanel` shows those notifications

#### Scenario: Panel empty state

- GIVEN the client has no notifications
- WHEN the client dashboard loads
- THEN the panel shows a localized empty-state message

---

### Requirement: Emit on Experience Approve and Reject

The experience approve route MUST create a `Notification` of type `EXPERIENCE_APPROVED` (audience `TRIPPER`) for the experience owner after updating the experience status. The experience reject route MUST create a `Notification` of type `EXPERIENCE_REJECTED` with `body` containing the review note. Both creates MUST be fire-and-forget and MUST NOT block the HTTP response. These emits MUST coexist with any existing email side-effects without mutual dependency.

#### Scenario: Approve emits notification

- GIVEN an experience in PENDING_REVIEW state
- WHEN an admin approves it
- THEN a `EXPERIENCE_APPROVED` notification exists for the owner and the HTTP response is not delayed by notification creation

#### Scenario: Reject emits notification with note

- GIVEN an experience in PENDING_REVIEW state
- WHEN an admin rejects it with a review note
- THEN an `EXPERIENCE_REJECTED` notification exists with `body = reviewNote` for the owner

#### Scenario: Emit failure does not block response

- GIVEN notification creation throws an error
- WHEN the approve or reject route executes
- THEN the HTTP response returns the updated experience normally

---

### Requirement: Localization

All user-visible strings on the notifications page and panel MUST be sourced from a `notifications` top-level key in `es.json` and `en.json`. Notification `title` and `body` stored in the database MUST be written in the user's locale at creation time. A `NotificationsDict` interface MUST be defined in `src/lib/types/dictionary.ts`.

#### Scenario: Dictionary key present

- GIVEN the `notifications` section is absent from es.json or en.json
- WHEN `npm run typecheck` is run
- THEN a type error is reported

#### Scenario: Locale-aware storage

- GIVEN a tripper whose locale is `en`
- WHEN an EXPERIENCE_APPROVED notification is created for them
- THEN `title` and `body` are stored in English
