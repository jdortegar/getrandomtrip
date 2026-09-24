# Proposal: Notifications Inbox (Split View)

## Intent

The notifications page is a flat feed: full bodies inline, no reading view, and inconsistent read semantics (rows with an `href` only mark read via a small icon; no mark-unread; `markRead` swallows errors). Turn it into an email-style inbox for all three roles with one predictable interaction: click a row, read it, act on it.

## Scope

### In Scope
- Split view in `RoleNotificationsPageClient`, selection in `?id=`. Desktop (`lg+`): list left, reading pane right, empty-pane state. Mobile: pane replaces list, back control clears `?id=`.
- Row: title, one-line body preview, relative time, unread dot; the whole row opens and marks read. Checkbox/bulk delete kept; `TableIconLink` split removed.
- Pane: title, timestamp, full body, primary CTA from `resolveHref`; Mark unread, Delete (`ConfirmModal`), Prev/Next within the current filtered page.
- `PATCH /api/notifications/[id]/read` accepts optional `{ isRead: boolean }` (defaults `true`; non-boolean returns 400); ownership scoped in the `where`.
- New `GET /api/notifications/[id]`, scoped by `userId` + `audience`, with no side effects.
- `unreadDotBus` fires after both read and unread. Errors are shown as localized microcopy.
- es/en dictionary keys + `dictionary.ts` types.

### Out of Scope (fast-follow)
Emit-site i18n fixes (destination-reveal type/Spanish copy, review titles), missing `BOOKING_*`/`PAYMENT_RECEIVED` emits, retention, preferences, unread-dot focus refetch, schema changes, new route files.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `notifications-management`: replace "Preserve Click-to-Mark-Read Semantics" with whole-row open + mark-read. Add these requirements: reading pane, `?id=` addressing, mark-unread contract, detail GET, error surfacing. Revise the "Unread filter + click" scenario so the pane stays open while the row leaves the list.
- `dashboard-shell`: the unread-dot refresh triggers gain mark-unread.

## Approach

- **Detail data:** use the loaded list item when present. Fetch `GET [id]` only when `?id=` is not on the current page (deep link, reload, page change). Marking read stays a separate PATCH, so GET stays safe.
- **Contract:** keep the `/read` path and add a boolean body. This is backward compatible and smaller than a new `PATCH [id]` plus removing `/read`.
- **Structure:** split the 473-line client into `NotificationListRow`, `NotificationReadingPane`, `NotificationEmptyPane` under `src/components/app/dashboard/shared/notifications/`. The client keeps query/selection state. There are no per-role forks.
- **Time:** use `Intl.RelativeTimeFormat` so relative times are locale-aware without new strings.

## Affected Areas

| Area | Impact |
|------|--------|
| `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` | Modified |
| `src/components/app/dashboard/shared/notifications/*` | New |
| `src/app/api/notifications/[id]/read/route.ts` | Modified |
| `src/app/api/notifications/[id]/route.ts` | Modified (add GET) |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified |
| `openspec/specs/{notifications-management,dashboard-shell}` | Delta |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Under the Unread filter, the opened item leaves the list, which breaks Prev/Next and the pane | High | The pane holds its own item snapshot; Prev/Next uses the pre-refetch order; test first |
| A `?id=` from another audience or user leaks | Med | GET `where` includes `userId` + `audience`; 404 is shown as an empty pane with a message |
| Mark-read regresses for href rows | Med | RED tests for row click on href and non-href rows |
| Oversized diff (single PR) | High | Record `size:exception`; slice API before UI inside the PR |

## Rollback Plan

Code-only, with no schema change or migration. Revert the PR. The GET route and the optional PATCH body are additive, and old clients still send no body.

## Dependencies

Existing `ConfirmModal`, `Pagination`, `unreadDotBus`, `notificationHrefs`. Strict TDD (Vitest + happy-dom).

## Success Criteria

- [ ] Row click opens the pane and marks read for all roles; there is no icon-only path.
- [ ] Reloading `?id=X` restores the selection, including off-page items.
- [ ] Mark unread and read both persist and update the dot without a remount.
- [ ] Cross-user and cross-audience GET/PATCH return 404 (tested).
- [ ] Mobile back clears `?id=`; the desktop empty pane renders.
- [ ] Failures show localized errors; es and en are complete; typecheck and Vitest pass.

**Size:** ~700–900 changed lines including tests (High).

## Amendment (2026-09-24) — split view replaced with a modal

The split view shipped, then the user reviewed it and said it "looks weird." Replaced with a Radix dialog (`src/components/ui/dialog.tsx`) reading view: the list stays full width always; opening a row opens a centered/full-screen-on-mobile modal instead of a sticky side pane. `NotificationReadingPane`'s content and actions, the `useNotificationSelection` hook (`?id=` sync, prev/next, delete-advance), the API, i18n structure, and mark-read/unread semantics are all unchanged — only the pane's *chrome* changed, from a persistent split-view column to a dialog. The desktop "nothing selected" empty state is gone (nothing renders when the dialog isn't open); `NotificationEmptyPane`'s `notFound`/`error` variants now render inside the dialog instead. See design.md's D9 for the full decision record and openspec/changes/notifications-inbox/specs/notifications-management/spec.md's "Reading Dialog Layout" requirement (replaces "Responsive Pane Layout").

Folded into the same amendment: the per-type icon puck (the round icon badge, e.g. `CircleCheck` for an approved experience) is removed from both the list row and the reading pane, for every notification type — the user asked to remove "that check icon" and clarified it should go for all types, not just the check-mark ones. The unread dot, the toolbar's "Mark all read" button, and the row selection checkbox are unrelated and were kept. `notificationIcons.ts` (`TYPE_ICONS`/`DANGER_TYPES`) had no other consumer once the puck was gone, so it was deleted outright.
