# Delta for Notifications Management

## ADDED Requirements

### Requirement: Reading Pane Content and Actions

Opening a notification MUST render a reading pane with its title, timestamp, full body, and (when `resolveHref` returns a href for that type/metadata) a primary CTA linking there. The pane MUST NOT render a per-type icon — no icon badge distinguishes notification types in the pane or in the list row (removed per user feedback 2026-09-24; see design.md's D9). The pane MUST expose Mark unread, Delete, and Prev/Next controls scoped to the currently filtered and paginated set, not the full unfiltered dataset.

#### Scenario: Pane shows full detail and CTA

- GIVEN a notification whose type/metadata resolves an href
- WHEN its row is opened
- THEN the pane renders title, timestamp, full body, and a CTA using that href — with no per-type icon
- AND a notification with no resolvable href renders the pane without a CTA

#### Scenario: Mark unread reverts read state

- GIVEN the pane is open on a read notification
- WHEN "Mark unread" is chosen
- THEN a `PATCH [id]/read` with `{isRead: false}` fires, the row shows unread, and the pane stays open on that item

#### Scenario: Delete advances to the next item

- GIVEN the pane is open on an item that has a next item in the current order
- WHEN delete is confirmed via `ConfirmModal`
- THEN the item is removed, the pane opens the next item in the current filtered/paginated order
- AND if no next item exists, the selection clears and the reading dialog closes

#### Scenario: Prev/Next stay within the current page's order

- GIVEN the pane is open on an item from the current filtered and paginated set
- WHEN Prev or Next is clicked
- THEN the pane opens the adjacent item from that same set, never crossing into another status filter or page

### Requirement: URL-Addressable Selection

Selecting a notification MUST set `?id={id}` in the URL. `status` and `page` MUST NOT be reflected in the URL — they remain client-only state. Reloading or deep-linking to a `?id=` URL MUST restore that selection: from the loaded page's data when present, otherwise via `GET [id]`.

#### Scenario: Reload restores an on-page selection

- GIVEN a notification is selected and `?id=` is set
- WHEN the page reloads
- THEN the same item reopens in the pane from the already-fetched page data

#### Scenario: Deep link to an off-page id fetches detail

- GIVEN `?id=` points to a notification not present on the currently loaded page
- WHEN the page loads
- THEN `GET [id]` fetches it and the pane renders it without changing the loaded list page

#### Scenario: Invalid, foreign, or wrong-audience id shows 404 empty state

- GIVEN `?id=` is malformed, belongs to another user, or belongs to another audience
- WHEN the page loads or the id is deep-linked
- THEN the reading dialog still opens (a notification is selected), `GET [id]` returns 404, and it renders a localized "not found" empty state inside the dialog instead of the item

### Requirement: Reading Dialog Layout

(Previously: "Responsive Pane Layout" — a two-column split view with a sticky side pane on desktop and a full-list-replacement pane on mobile. Changed per user feedback 2026-09-24: the split view "looked weird" — see design.md's Architecture Decisions for the modal decision entry.)

Opening a notification MUST render its content in a modal dialog, not a persistent side pane. The list MUST remain full width and visible at all times — it is never hidden or replaced, on any viewport. The dialog MUST render centered with a bounded max width on wider viewports and full-screen on narrow viewports, with a visible close control and an internally scrollable body for long messages. The dialog is open if and only if a notification is selected (`?id=` is set); there is no "nothing selected" empty state, because nothing renders when no notification is selected.

#### Scenario: Row click opens the reading dialog

- GIVEN any viewport width
- WHEN a row is opened
- THEN a modal dialog opens showing that notification's content
- AND the list underneath stays full width and visible, unhidden and unreplaced

#### Scenario: Closing the dialog clears the selection

- GIVEN the reading dialog is open
- WHEN the user dismisses it (its close control, an outside click, or Esc)
- THEN the dialog closes and `?id=` clears
- AND if this session pushed the current `?id=` entry, the browser's back button also closes it (history semantics unaffected by the layout change)

#### Scenario: A nested confirmation dismisses independently of the reading dialog

- GIVEN the reading dialog is open and its delete-confirmation modal is also open on top of it
- WHEN Esc is pressed
- THEN only the topmost (confirmation) modal closes
- AND the reading dialog remains open

### Requirement: Mark Read or Unread Contract

`PATCH /api/notifications/[id]/read` MUST accept an optional `{ isRead?: boolean }` body, defaulting to `true` when omitted, MUST return 400 when `isRead` is present but not a boolean, and MUST remain scoped to `{ id, userId: session.user.id }` in the `where` clause.

#### Scenario: Omitted body defaults to marking read

- GIVEN an unread notification owned by the caller
- WHEN `PATCH [id]/read` is called with no body
- THEN the notification becomes read

#### Scenario: Explicit false marks unread

- GIVEN a read notification owned by the caller
- WHEN `PATCH [id]/read` is called with `{ isRead: false }`
- THEN the notification becomes unread

#### Scenario: Non-boolean isRead is rejected

- WHEN `PATCH [id]/read` is called with `{ isRead: "true" }` or any non-boolean value
- THEN the response is 400 and no row is updated

### Requirement: Notification Detail Retrieval

`GET /api/notifications/[id]` MUST return the notification scoped by both `userId` and `audience`, with no side effects — it MUST NOT alter read state — and MUST return 404 when the id does not exist, belongs to another user, or belongs to another audience.

#### Scenario: Owner fetches their own notification

- GIVEN a notification owned by the caller in their audience
- WHEN `GET [id]` is called
- THEN the notification is returned and its `isRead` state is unchanged by the call

#### Scenario: Foreign or wrong-audience id returns 404

- GIVEN an id owned by another user or belonging to another audience
- WHEN `GET [id]` is called by the caller
- THEN the response is 404

### Requirement: Error Surfacing for Pane Actions

Failures on mark unread, delete, or detail fetch MUST render localized microcopy in the UI rather than fail silently.

#### Scenario: Mark-unread failure shows a message

- GIVEN the `PATCH [id]/read` call fails
- WHEN "Mark unread" is chosen
- THEN a localized error message renders in the pane and the row's read state does not change

## MODIFIED Requirements

### Requirement: Whole-Row Open and Mark-Read

(Previously: "Preserve Click-to-Mark-Read Semantics" — rows without an href were click-to-mark-read on the whole row, while rows with an href required clicking a separate action icon.)

The system MUST open the reading pane and mark the notification read via `PATCH /api/notifications/[id]/read` when the user opens any row — regardless of whether that notification's type resolves an href. There is no separate icon-only path.

#### Scenario: Opening any row marks it read

- GIVEN an unread notification row, with or without a resolvable href
- WHEN the user opens the row (click or keyboard activation)
- THEN the pane opens on that item
- AND a `PATCH [id]/read` request fires, updating the row and pane to read

#### Scenario: Unread filter keeps the pane open when the row leaves the list

- GIVEN the list is filtered to `status=unread` and shows the notification just opened
- WHEN opening it marks it read
- THEN it disappears from the unread-filtered list on the next re-fetch
- AND the reading pane keeps showing that item, with Prev/Next still resolving against the pre-refetch order — no special-case logic pins the row visible in the list itself
