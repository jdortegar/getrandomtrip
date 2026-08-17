# Proposal: Notifications Filter, Pagination and Bulk Delete

## Intent

The notifications page is the only list surface in the dashboard that has **no filter, no selection, no pagination, and no delete**. A user cannot narrow to unread, cannot remove anything ever, and the page loads every notification the account has ever received on every visit.

Two other list surfaces in this app already solved this and agree on one pattern — `ExperiencesPageClient.tsx` ("My Experiences") and `BlogPageClient.tsx` ("My Blog Posts"): filter row → checkbox column → "Delete selected (N)" → `ConfirmModal` → per-id `DELETE` via `Promise.allSettled` → paginated client fetch. The ask is to bring notifications up to that same convention, adding a read-status filter (All / Unread / Read) and bulk delete for **all three roles** (traveler, tripper, admin).

That is cheap to say and structurally expensive to do, because notifications currently have none of the plumbing the pattern assumes: the server pages query Prisma directly with no query params, and **no `DELETE` endpoint for `Notification` exists at all**.

## Current State (researched, not assumed)

- **One shared client component, three thin server pages.** `admin/notifications/page.tsx`, `tripper/notifications/page.tsx` and `traveler/notifications/page.tsx` are ~10-line pass-throughs (via `AdminNotificationsPageClient`, `NotificationsPageClient`, `TravelerNotificationsPageClient`) into `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` (227 lines). Role variance is **only** `resolveHref` (`src/lib/helpers/notificationHrefs.ts`) plus which `audience` enum the server page queries.
- Server pages are `async`: `getServerSession` + `prisma.notification.findMany`, serialized to `ClientNotification[]` and passed as `initialNotifications`. **No pagination, no query params, no client fetch on first load.**
- `Notification` (`prisma/schema.prisma:590-606`): `id, userId, type, audience, isRead @default(false), title, body?, metadata?, createdAt`. Indexed `[userId, isRead]` and `[userId, createdAt]`. **No `readAt`, no soft-delete/archive flag.**
- `src/app/api/notifications/` contains exactly three routes: `route.ts` (GET list), `unread-count/route.ts` (GET count), `[id]/read/route.ts` (PATCH). **There is no DELETE.**
- "Mark all read" today loops `unreadIds.map(id => fetch(.../read, { method: "PATCH" }))` under `Promise.all`. This currently equals "everything", only because nothing is paginated yet.
- `DashboardUnreadDot.tsx` polls `GET /api/notifications/unread-count?audience=...` **only on mount**, so the navbar badge already goes stale after a mark-read click — a latent bug that bulk actions would make obvious.
- Dead code confirmed (grep: zero importers outside each other): `src/components/app/notifications/NotificationsPanel.tsx` → `NotificationsList.tsx` → `NotificationItem.tsx`. A duplicate notification-list stack nothing renders.

## Decision Log

All decisions were resolved in a live grill-me session against the code and are **final** for this change.

| # | Decision |
|---|----------|
| 1 | **Full rearchitecture, not an in-memory filter.** `GET /api/notifications` gains `page` / `limit` / `status` params, and `RoleNotificationsPageClient` converts to the client-fetch + `useEffect` + paginated shape used by experiences/blog. Pagination reuses the existing shared `src/components/ui/Pagination.tsx` (piloted on the admin trip-requests table). Pagination is explicitly **in scope** — filtering an unbounded list client-side would keep the real problem (loading everything) and diverge from the very pattern we are matching. |
| 2 | **Delete = new `DELETE /api/notifications/[id]/route.ts`, called once per selected id via `Promise.allSettled`.** Not a batch endpoint. Neither `DELETE /api/tripper/experiences` nor `DELETE /api/tripper/blogs` exists — both live implementations do per-item deletes and tally failures. Matching convention beats a lone "more efficient" bulk route. |
| 3 | **No locked-row concept.** Every notification is deletable regardless of `type`, `isRead` or `audience`. Blog's `isBlogRowLockedForDeletion` guard exists because a review copy references its parent by a bare `parentId` string with no FK/cascade; a notification is self-contained, so there is no orphaning analogue to protect. |
| 4 | **Unread filter + click:** clicking a notification while filtered to "Unread" marks it read and it **disappears** from the view. This falls out of re-filtering after the state change; no special-casing to pin it visible. |
| 5 | **Select-all is current-page only**, exactly as in experiences/blog. A cross-page "select all N matching this filter" action is unprecedented in this app and was explicitly rejected. |
| 6 | **"Mark all read" stays global** (every unread row for that role/audience, not just the visible page) — behavior parity with today. Since the page now loads one page's worth of rows, the N-parallel-PATCH approach no longer covers "everything", so this needs a new dedicated endpoint, e.g. `PATCH /api/notifications/read-all`, scoped by `audience` + session user. |
| 7 | **Delete the dead stack** (`NotificationsPanel` / `NotificationsList` / `NotificationItem`). In scope by explicit choice: once the real component grows filtering and pagination, a superficially-similar orphan is an active trap. |
| 8 | **Fix the navbar unread-dot staleness** as part of this change. After any bulk mark-read or delete, the dot must refresh instead of waiting for its own next mount. Design picks the mechanism (shared context / small event bus / layout-level unread-count provider both the dot and the page subscribe to). One fix covers both the pre-existing single-click case and the new bulk case. |
| 9 | **No search box.** The ask was read-status filtering, not full parity with experiences/blog. Notification titles/bodies are short system-generated strings — low search value. |
| 10 | **Filter dropdown:** three options mapping to `status` (`all` \| `unread` \| `read`), built with `src/components/ui/Select.tsx` and the local `SELECT_CLASS` convention both live tables already use — **not** `FormSelectField`, which `component-patterns.md` reserves for form-step fields. |
| 11 | **Applies uniformly to all three roles** through `RoleNotificationsPageClient`. No per-role forking of the new logic; only the existing `resolveHref` / `audience` variance stays role-specific. |

### Reference pattern (from the two live implementations)

- Checkbox column first; select-all in `<thead>` via a ref'd native checkbox with a manually-set `.indeterminate` (there is no native prop).
- "Delete selected (N)" sits inline in the filter row, danger-ink styled (`border-2 border-red-600 bg-red-600 … text-white`), `disabled` when nothing is selected, and always goes through `<ConfirmModal tone="danger">`.
- **Selection clears on any filter/page change** — quoting `BlogPageClient.tsx:128-130`: *"a destructive bulk action should only ever act on rows the user can currently see"*.
- Partial failures surface through a `bulkFailureMessage` banner.
- Filter row layout per `.claude/rules/design-system.md:170-189`: `flex items-center justify-between gap-3 flex-wrap`, controls left, `{filtered} of {total} {noun}` count right — both count keys required in both locales.

## Scope

### In Scope

**API**
- `GET /api/notifications` (and the equivalent server-page query path): accept `page`, `limit`, `status`; return rows + total for `Pagination`.
- `DELETE /api/notifications/[id]/route.ts` — **new**; server-side ownership check against the session `userId`.
- `PATCH /api/notifications/read-all` — **new**; scoped by session `userId` + `audience`.

**Client**
- `RoleNotificationsPageClient.tsx`: client-fetch + `useEffect` + paginated rearchitecture; All/Unread/Read `Select`; checkbox column + tri-state select-all; "Delete selected (N)" + `ConfirmModal`; `bulkFailureMessage` banner; selection cleared on filter/page change; `Pagination` from `src/components/ui/Pagination.tsx`.
- The three role server pages adapt to the new data contract (initial page only, or client-fetched).

**Freshness**
- `DashboardUnreadDot.tsx` refreshes after mark-read / mark-all-read / delete instead of only on mount.

**Cleanup**
- Delete `NotificationsPanel.tsx`, `NotificationsList.tsx`, `NotificationItem.tsx`.

**Copy**
- New keys in **both** `src/dictionaries/es.json` and `en.json` (+ `src/lib/types/dictionary.ts`): filter label and its three options, "Delete selected", confirm-modal title/body/buttons, bulk-failure message, empty-state-under-filter text, and the `of` / count noun. Extend the existing notifications dict section rather than adding a new one.

### Out of Scope

- Search / free-text filter box.
- Any locked-row or undeletable-notification concept.
- Cross-page "select all matching filter" bulk action.
- Filtering by `type` or `audience` — read status only.
- Schema changes: no `readAt`, no soft-delete/`archivedAt` flag. Delete is a hard delete.
- A batch/bulk `DELETE` collection endpoint.
- Any change to notification *creation* / fan-out logic.

## Capabilities

### New Capabilities

- `notifications-management`: the notifications list contract — read-status filtering, pagination, current-page selection semantics, per-id ownership-scoped deletion, global mark-all-read, and the unread-count freshness guarantee.

### Modified Capabilities

- `dashboard-shell`: the "Unread count reflects only the admin's own notifications" requirement (`openspec/specs/dashboard-shell/spec.md:54-68`) currently only constrains the dot's *source*. It gains a freshness requirement — the dot must reflect mark-read and delete mutations without a remount.

## Approach

The shared-component architecture is the leverage here: because all three roles already funnel into one 227-line client component whose only role variance is `resolveHref` and `audience`, the entire feature is written once. That is precisely why the rearchitecture is affordable, and why per-role forking is forbidden.

Data flow inverts. Today the server page is the data source and the client is presentational-with-local-state; after this change the client owns query state (`status`, `page`) and fetches, which is the shape experiences/blog already use and the only shape a filter dropdown plus pagination can share without a second source of truth. The `status` param maps directly onto the existing `[userId, isRead]` index, so filtered reads stay indexed.

Writes stay deliberately dumb. Per-id `DELETE` under `Promise.allSettled` is chosen over a batch route because it matches both live precedents, degrades to a partial-failure banner instead of an all-or-nothing transaction, and needs no new authorization surface beyond the single-row ownership check the existing `PATCH /api/notifications/[id]/read` already models. Mark-all-read is the one genuine exception: it must act beyond the loaded page, so it becomes a single scoped `updateMany` rather than fan-out.

Unread-count freshness is bundled rather than deferred because the bug and its worst manifestation share one root cause — a mount-only fetch with no invalidation channel — and fixing it twice would be strictly worse.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/notifications/route.ts` | Modified | `page` / `limit` / `status` params, total count |
| `src/app/api/notifications/[id]/route.ts` | New | `DELETE`, ownership-scoped |
| `src/app/api/notifications/read-all/route.ts` | New | `PATCH`, scoped by `userId` + `audience` |
| `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` | Modified | Filter, selection, bulk delete, pagination — the bulk of the diff |
| `dashboard/{admin,tripper,traveler}/notifications/page.tsx` | Modified | Adapt to the new data contract |
| `AdminNotificationsPageClient.tsx`, `NotificationsPageClient.tsx`, `TravelerNotificationsPageClient.tsx` | Modified | Pass-through prop changes only |
| `src/components/app/dashboard/shell/DashboardUnreadDot.tsx` (+ provider/bus) | Modified / New | Refresh on mutation |
| `src/components/app/notifications/{NotificationsPanel,NotificationsList,NotificationItem}.tsx` | Removed | Dead code |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | Filter, bulk-delete, confirm, failure, count copy |

**Size**: 3 API surfaces (1 modified, 2 new) + a 227-line component rearchitecture + a cross-component freshness mechanism + 3 file deletions + dual-locale copy. This is comparable in weight to `tripper-profile-visibility`; expect **High** 400-line budget risk once strict-TDD coverage is included. `delivery_strategy` is `ask-on-risk`, so `sdd-tasks` must forecast honestly and the user decides on chaining. Natural slice boundary: **(A)** API layer — paginated/filtered GET, `DELETE [id]`, `read-all`; **(B)** client rearchitecture — filter + pagination + selection + bulk delete + copy; **(C)** unread-dot freshness + dead-code removal.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Client rearchitecture regresses the existing `clickToMarkRead` / action-link mark-read behavior | High | Spec must restate today's click semantics as requirements; RED tests before the rewrite |
| `DELETE` trusts the client-supplied id and lets a user delete someone else's row | Med | Ownership check in the `where` (`{ id, userId: session.user.id }`), not a post-fetch comparison; mirror `[id]/read/route.ts`; explicit cross-user test |
| Bulk delete acts on rows the user cannot see (stale selection after a filter/page change) | Med | Clear selection on every `status`/`page` change, per `BlogPageClient.tsx:128-130` |
| Partial `Promise.allSettled` failure leaves the list and count inconsistent | Med | Refetch the current page after any bulk action; show `bulkFailureMessage` with the failed tally |
| "Mark all read" silently shrinks to page scope during the rearchitecture | Med | Decision #6 is a spec requirement; `read-all` must be verified against rows outside page 1 |
| Deleting the last row on the last page leaves an empty page | Low | Clamp `page` to the new total after any delete-triggered refetch |
| Unread dot desync if the refresh channel is wired for delete but not mark-read (or vice versa) | Low | One channel, invoked from every mutation path; test all three triggers |
| Dead-code deletion breaks an importer grep missed | Low | Re-run `rg` at apply time before deleting |
| Missing `en`/`es` copy | Low | Dual-locale keys enforced by `.claude/rules/i18n-and-types.md`; typecheck gates the dict type |
| Hard delete is irreversible with no undo affordance | Low | Accepted — `ConfirmModal tone="danger"` is the guard, matching experiences/blog; soft delete is explicitly out of scope |

## Rollback Plan

Fully code-only — there is **no schema change and no data migration**, so a straight revert restores prior behavior exactly. The two new routes are additive and become unreachable once the client is reverted; they can be left in place or removed independently. Deleted notifications are the one irreversible effect: reverting the code does not restore rows, so if delete misbehaves in production, revert the client first (removing the affordance) and only then investigate the endpoint. The dead-code deletion is recoverable from git history if the removal turns out to be wrong.

## Dependencies

- **Ordering**: the paginated/filtered `GET` contract must land before or together with the client rearchitecture that consumes it. If chained, slice A precedes slice B.
- Existing primitives, all already present — no new libraries: `src/components/ui/Pagination.tsx`, `src/components/ui/Select.tsx`, `ConfirmModal`, `src/lib/helpers/notificationHrefs.ts`.
- Vitest + happy-dom (strict TDD active): spec/design/tasks must plan RED/GREEN coverage for the `status` filter query, `DELETE` ownership rejection, `read-all` scoping beyond page 1, selection-clearing on filter change, and partial-failure tallying.

## Success Criteria

- [ ] All three roles (traveler, tripper, admin) get filter + pagination + bulk delete from one shared component, with zero per-role forks of the new logic.
- [ ] The All/Unread/Read dropdown filters server-side via `status` and the result count renders as `{filtered} of {total} {noun}` in both locales.
- [ ] Clicking an unread notification while filtered to "Unread" marks it read and removes it from the view.
- [ ] Select-all checks only the current page and shows the indeterminate state on a partial selection.
- [ ] Selection is empty after any filter or page change.
- [ ] "Delete selected (N)" is disabled with nothing selected, always confirms, and reports partial failures in a banner.
- [ ] `DELETE /api/notifications/[id]` returns 403/404 for a notification owned by another user — verified by test.
- [ ] "Mark all read" clears unread rows that were never loaded onto the current page.
- [ ] The navbar unread dot updates after mark-read, mark-all-read, and delete without a remount or navigation.
- [ ] `NotificationsPanel` / `NotificationsList` / `NotificationItem` are gone and nothing imports them.
- [ ] No `prisma/schema.prisma` diff.
- [ ] All new copy present in `es` and `en`; `npm run typecheck` and the vitest suite pass.
