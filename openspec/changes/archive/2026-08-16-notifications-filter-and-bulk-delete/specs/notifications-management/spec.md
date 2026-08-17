# Notifications Management Specification

## Purpose

Contract for the notifications list shared by traveler, tripper, and admin dashboards via `RoleNotificationsPageClient`: read-status filtering, pagination, current-page-scoped bulk selection, ownership-scoped per-id deletion, global mark-all-read, and preservation of today's click-to-mark-read behavior through the rearchitecture.

## Requirements

### Requirement: Preserve Click-to-Mark-Read Semantics

The system MUST continue to mark a notification read via `PATCH /api/notifications/[id]/read` on user interaction, unchanged by the list rearchitecture.

#### Scenario: Click a row with no href

- GIVEN an unread notification row with no navigable href
- WHEN the user clicks anywhere on the row
- THEN a `PATCH /api/notifications/[id]/read` request fires for that id
- AND the row's state updates to read

#### Scenario: Click the action link/button on an unread row with an href

- GIVEN an unread notification row that has a navigable href and action control
- WHEN the user clicks the action link/button
- THEN a `PATCH /api/notifications/[id]/read` request fires for that id
- AND the row's state updates to read

#### Scenario: Unread filter + click removes the row

- GIVEN the list is filtered to `status=unread` and shows the notification just clicked
- WHEN the click marks that notification read
- THEN it no longer appears in the unread-filtered view after the next re-fetch/re-render
- AND no special-case logic pins it visible

### Requirement: Paginated and Filtered Notification List

`GET /api/notifications` MUST accept `page`, `limit`, and `status` (`all`|`unread`|`read`) and return the matching page of rows plus a total count. `RoleNotificationsPageClient` MUST apply this identically for all three roles; only `resolveHref` and `audience` vary per role.

#### Scenario: Status filter narrows results per role

- GIVEN a traveler, tripper, or admin with both read and unread notifications
- WHEN they select "Unread"
- THEN the server returns only unread rows for that user's audience, paginated
- AND the count renders as "{filtered} of {total}" in both locales

#### Scenario: Pagination changes the visible page

- GIVEN more notifications exist than fit on one page
- WHEN the user navigates to page 2 via `Pagination`
- THEN the client requests `page=2` with the current `status` filter and renders that page's rows

### Requirement: Per-Notification Deletion With Ownership Scoping

`DELETE /api/notifications/[id]` MUST exist and MUST scope the delete via `{ id, userId: session.user.id }` inside the Prisma `where` clause itself, not a post-fetch comparison.

#### Scenario: Owner deletes their own notification

- GIVEN a notification owned by the signed-in user
- WHEN `DELETE /api/notifications/[id]` is called for that id
- THEN the row is removed and the response indicates success

#### Scenario: Cross-user delete is rejected

- GIVEN a notification owned by a different user
- WHEN the signed-in user calls `DELETE /api/notifications/[id]` for that id
- THEN the `where` clause matches zero rows, the request fails (403/404), and the other user's row remains intact

### Requirement: Bulk Delete Selection and Execution

The list MUST offer a checkbox column, a select-all scoped to the current page, and a "Delete selected (N)" action that confirms via `ConfirmModal` before issuing one `DELETE` per selected id via `Promise.allSettled` (no batch endpoint).

#### Scenario: Select-all scopes to the current page only

- GIVEN two pages of notifications, with select-all checked on page 1
- WHEN the user navigates to page 2
- THEN no page-2 rows are pre-selected
- AND selection reflects only what was checked on page 1 until cleared

#### Scenario: Bulk delete with partial failure

- GIVEN N notifications selected on the current page
- WHEN "Delete selected (N)" is confirmed and one of the N `DELETE` calls fails
- THEN the successfully deleted rows disappear, the page refetches, and a `bulkFailureMessage` banner reports the failed count

#### Scenario: Selection clears on filter or page change

- GIVEN one or more rows are selected
- WHEN the `status` filter or the `page` changes
- THEN the selection is cleared

### Requirement: Global Mark-All-Read

`PATCH /api/notifications/read-all` MUST mark every unread notification for the signed-in user's audience as read in one scoped update, independent of pagination.

#### Scenario: Mark-all-read reaches unread rows beyond the loaded page

- GIVEN more than one page of unread notifications exist for the signed-in user's audience, and only page 1 is loaded client-side
- WHEN "mark all read" is invoked
- THEN every unread notification for that user/audience becomes read, including rows never loaded onto the visible page — not only the current page's ids

## Non-Goals (Explicit, Not Gaps)

- No free-text search/filter box — status is the only filter dimension.
- No cross-page "select all matching filter" — select-all is current-page only by design.
- No filtering by `type` or `audience`.
- No locked-row/undeletable-notification concept — every notification is deletable regardless of `type`, `isRead`, or `audience`; this absence is deliberate, not an omission to flag.
- Dead-code removal of `NotificationsPanel`, `NotificationsList`, `NotificationItem` is cleanup with no independent behavioral contract for this spec to verify.
- No schema changes — no `readAt`, no soft-delete flag; delete is a hard delete.
- No batch/bulk `DELETE` collection endpoint — deletion is strictly per-id.
