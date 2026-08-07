# Tasks: Notifications Filter, Pagination and Bulk Delete

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,600–1,750 (higher than the proposal/design's 950–1150 estimate — see note below) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Slice A) → PR 2 (Slice B1) → PR 3 (Slice B2) ; PR 4 (Slice C) independent |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

**Estimate correction**: the proposal/design's 950–1150 estimate undercounts. Checked against real file sizes: `route.ts` is 27 lines today but its GET has **zero existing test coverage** — `route.test.ts`, `[id]/__tests__/route.test.ts`, and `read-all/__tests__/route.test.ts` are all net-new files with full `next-auth`/`@/lib/prisma` mock boilerplate (~100–130 lines each per the `tripper/experiences` precedent), pushing Slice A alone to ~600–650 lines. `RoleNotificationsPageClient.tsx` (227 lines today) roughly doubles, and its characterization + new-behavior test file is net-new (~200+ lines), pushing Slice B to ~750–800 lines. Slice C's dead-code deletion is a confirmed 157 lines (46+54+57 across the three files). Total is materially above the "comparable to tripper-profile-visibility" claim.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| A | Shared query module + `GET` modify + `DELETE [id]` + `read-all`, all with tests | PR 1 | ~600–650 lines. Still likely over budget alone; may need `size:exception` even if chained |
| B1 | Client data layer: state/fetch/filter/pagination, 3 server pages, 3 pass-through clients, `filters`/`table.select*`/count dict keys | PR 2 | Depends on PR 1 (consumes `GET` contract). ~450–500 lines |
| B2 | Bulk delete UI: checkbox column, select-all, "Delete selected", `ConfirmModal`, `bulkFailureMessage`, `bulkActions` dict keys | PR 3 | Depends on PR 2 (same file) + PR 1 (`DELETE` endpoint). ~300–350 lines |
| C | `unreadDotBus.ts` + `DashboardUnreadDot` wiring + delete 3 dead files | PR 4 | Independent of A/B ordering. **Gotcha**: create `unreadDotBus.ts` early/in parallel — B1/B2's `publishUnreadRefresh()` calls need the module to exist to compile, even though the dot-wiring + deletion can land in any order |

## Phase A: Shared Query Module & API Layer (PR 1)

- [x] A.1 Create `src/lib/notifications/list-query.ts`: `NOTIFICATIONS_PAGE_SIZE`, `NOTIFICATIONS_MAX_LIMIT`, `parseNotificationStatus`, `parseNotificationAudience`, `notificationListWhere`, `toClientNotification`.
- [x] A.2 RED: write `src/lib/notifications/__tests__/list-query.test.ts` — `unread`→`isRead:false`, `read`→`isRead:true`, `all`→no `isRead` key, `audience:null` omits audience, parsers reject junk input.
- [x] A.3 GREEN: implement `list-query.ts` against A.2.
- [x] A.4 RED: write `src/app/api/notifications/__tests__/route.test.ts` (net-new) — 401 no session; `page`/`limit` → `skip`/`take`; `limit` clamps at 100; `status` narrows `where`; `unreadTotal` ignores `status`.
- [x] A.5 RED (regression, D9): same file — `?audience=ADMIN` **does** filter to `ADMIN` rows only (today it silently returns every audience — `route.ts:21` only whitelists `TRAVELER`/`TRIPPER`).
- [x] A.6 GREEN: modify `src/app/api/notifications/route.ts` — accept `page`/`limit`/`status`, whitelist `ADMIN`, import `list-query.ts`, return `{ notifications, total, unreadTotal, page, limit }`.
- [x] A.7 RED: write `src/app/api/notifications/[id]/__tests__/route.test.ts` — 401 no session; 200 + `{ success: true }` on owner delete; **404 when the row belongs to another user** (proves `deleteMany` ownership scoping, not a post-fetch check).
- [x] A.8 GREEN: create `src/app/api/notifications/[id]/route.ts` — `DELETE` via `prisma.notification.deleteMany({ where: { id, userId } })`, 401/404/200 per design.
- [x] A.9 RED: write `src/app/api/notifications/read-all/__tests__/route.test.ts` — 401 no session; 400 on missing/invalid `audience`; `updateMany` `where` = `{ userId, audience, isRead: false }` with **no id constraint**, proving it reaches unread rows never loaded onto page 1.
- [x] A.10 GREEN: create `src/app/api/notifications/read-all/route.ts` per design (400 on invalid audience — no `?? "TRIPPER"` fallback, per D6).

## Phase B1: Client Data Layer — Filter, Pagination, Props (PR 2, depends on Phase A)

- [x] B1.1 RED (characterization — write against CURRENT behavior before touching the component): extend `src/components/app/dashboard/shared/__tests__/RoleNotificationsPageClient.test.tsx` (new file) with the two click-to-mark-read scenarios from spec.md — click a href-less unread row fires `PATCH [id]/read`; clicking the action link/button on an href-bearing unread row also fires it. Confirm both pass against today's component before any rearchitecture.
- [x] B1.2 Widen `RoleNotificationsPageClientProps`: add `audience`, `initialPage`, `initialStatus`, `initialTotal`, `initialUnreadTotal`; replace `useMemo unreadCount` with `unreadTotal` state.
- [x] B1.3 Implement `fetchNotifications` (`useCallback`), `hydratedRef` mount-skip, `updateStatus`/`handlePageChange` (clear selection — selection state itself lands in B2, but these functions must exist now), page-clamp-on-delete logic.
- [x] B1.4 Add filter row: `Select` (All/Unread/Read) using `SELECT_CLASS`, `{filtered} of {total} {noun}` count, per `design-system.md` filter-row layout.
- [x] B1.5 Wire `<Pagination>` (from `src/components/ui/Pagination.tsx`) after the panel, prop set per `ExperiencesPageClient.tsx`.
- [x] B1.6 RED then GREEN: pagination test — navigating to page 2 requests `page=2` with the current `status` and renders that page.
- [x] B1.7 Rewire the click-to-mark-read handlers to re-run B1.1's characterization tests unchanged; add the "unread filter + click removes the row" scenario (refetch when `status === "unread"`).
- [x] B1.8 Modify all 3 role server pages (`dashboard/{admin,traveler,tripper}/notifications/page.tsx`) — read `page`/`status` from `searchParams`, use `notificationListWhere`/`toClientNotification`, pass new props.
- [x] B1.9 Modify `AdminNotificationsPageClient.tsx`, `NotificationsPageClient.tsx`, `TravelerNotificationsPageClient.tsx` — widen prop types only, keep `{...props}` spread.
- [x] B1.10 Add `filters.*` (statusLabel/all/unread/read/of/count) and `emptyStateFiltered` keys to `NotificationsDict` (`src/lib/types/dictionary.ts`) and both `src/dictionaries/{es,en}.json`.
- [x] B1.11 `npm run typecheck` clean for B1 scope.

## Phase B2: Bulk Delete UI (PR 3, depends on Phase A + B1)

- [x] B2.1 Add `selectedIds` state, `toggleSelectAll`/`toggleRowSelected`, `selectAllRef` + `indeterminate` effect (verbatim shape from `ExperiencesPageClient.tsx`).
- [x] B2.2 Add header select-all strip and per-row checkbox as first flex child, with `onClick={(e) => e.stopPropagation()}` **and** `onKeyDown={(e) => e.stopPropagation()}` (both mandatory — the row's `onClick`/`onKeyDown` mark-read handlers would otherwise fire when ticking a box).
- [x] B2.3 RED: test that checking a row's checkbox does NOT fire `PATCH [id]/read` (proves B2.2's `stopPropagation` on both handlers).
- [x] B2.4 RED: **select-all is scoped to the current page only** — check select-all on page 1, navigate to page 2, assert no page-2 row is pre-selected.
- [x] B2.5 GREEN for B2.3/B2.4.
- [x] B2.6 Clear `selectedIds` on every `status`/`page` change (extend B1.3's `updateStatus`/`handlePageChange`); RED+GREEN test: selection empties after a filter change and after a page change.
- [x] B2.7 Add "Delete selected (N)" button (danger-ink, `disabled` at 0 selected) + `ConfirmModal tone="danger"` wiring.
- [x] B2.8 Implement `handleBulkDelete` — per-id `DELETE` via `Promise.allSettled`, `bulkFailureMessage` banner, refetch current page, `publishUnreadRefresh()` call (module created in Phase C — see C.1 ordering note).
- [x] B2.9 RED then GREEN: bulk delete with partial failure — N selected, one `DELETE` fails, banner reports the failed tally and succeeded rows disappear.
- [x] B2.10 Add `table.selectAll`/`table.selectRow` and `bulkActions.*` (deleteSelected/confirmTitle/confirmBody/confirm/cancel/partialFailure) keys to `NotificationsDict` and both locale JSONs.
- [x] B2.11 `npm run typecheck` and full `npm run test` clean for B1+B2 scope.

## Phase C: Unread-Dot Freshness & Dead Code Removal (PR 4, independent — create C.1 early/in parallel with A)

- [x] C.1 Create `src/lib/notifications/unreadDotBus.ts` (`subscribeUnreadRefresh`/`publishUnreadRefresh`) — do this early so B1/B2's `publishUnreadRefresh()` imports resolve regardless of merge order.
- [x] C.2 RED then GREEN: `src/lib/notifications/__tests__/unreadDotBus.test.ts` — subscribe→publish invokes listener; unsubscribe stops it; multi-listener fan-out.
- [x] C.3 Modify `DashboardUnreadDot.tsx` — extract fetch into `useCallback refresh`, subscribe via `subscribeUnreadRefresh` in a `useEffect`, unsubscribe on cleanup.
- [x] C.4 Wire `publishUnreadRefresh()` into `markRead` and `markAllRead` in `RoleNotificationsPageClient.tsx` (bulk-delete call already added at B2.8).
- [x] C.5 RED then GREEN: dot refresh test — mock the bus, assert `refresh` fires on a published event without remount.
- [x] C.6 Re-run `rg 'NotificationsPanel|NotificationsList|NotificationItem' src` to reconfirm zero external importers, then delete `src/components/app/notifications/{NotificationsPanel,NotificationsList,NotificationItem}.tsx`.
- [x] C.7 `npm run typecheck` and `npm run test` clean after deletion.

## Phase D: Cross-Cutting Verification

- [x] D.1 Full `npm run test` (all new + existing suites) and `npm run typecheck` pass.
- [x] D.2 Confirm `git diff prisma/schema.prisma` is empty — no migration.
- [ ] D.3 Manual QA: all 3 roles (traveler/tripper/admin) — filter, paginate, select, bulk-delete, mark-all-read beyond page 1, unread dot updates live.
