# Verification Report: notifications-filter-and-bulk-delete

**Verdict: PASS**

## Mode

Independent fresh-context verification, openspec artifact store. The prior apply batch's own state.yaml revision note was treated as an unverified claim throughout — every finding below is from direct file reads and fresh command runs in this session, not from trusting that note.

## Context

The apply agent died mid-response from a connection error while writing its own state.yaml note. `state.yaml` on disk already shows `status: apply` (not the stale `tasks` the apply-progress note describes needing a manual fix for), so that self-correction had in fact landed before the crash. This phase re-verified everything from scratch regardless.

## Completeness (tasks.md)

41/42 tasks checked complete. Only `D.3` (manual browser QA across all 3 roles) is unchecked — correctly so, since it requires a running browser and human interaction, which is outside any agent's reach. All Phase A/B1/B2/C tasks and `D.1`/`D.2` are checked and independently confirmed against real code below.

## Fresh Command Evidence

- `npm run typecheck` → clean, zero errors (re-run this session, not trusted from the prior report).
- `npm run test -- --run` → **132 test files, 963/963 tests passed** (re-run this session; matches the claimed number exactly).
- `git diff --stat prisma/schema.prisma` → empty. No schema diff, confirmed independently.

## Spec Compliance Matrix — `notifications-management` (7 requirements)

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 1 | Preserve click-to-mark-read (both paths + unread-filter disappearance) | `RoleNotificationsPageClient.tsx:372` (`onClick={clickToMarkRead ? () => markRead(id) : undefined}`) for href-less rows; `:430` (`onClick={() => { if (!isRead) markRead(id); }}` inside `<TableIconLink>`) for href-bearing action rows; `markRead()` at `:185-186` calls `fetchNotifications()` when `status === "unread"`, causing the row to leave the filtered view. Covered by 2 passing characterization tests in `RoleNotificationsPageClient.test.tsx` (lines 110-176), written to pass against the CURRENT component per B1.1 before the rewrite, and still passing now. | PASS |
| 2 | `DELETE /api/notifications/[id]` ownership-scoped in the `where` itself, 404 on cross-user | `route.ts:21-23`: `prisma.notification.deleteMany({ where: { id, userId: session.user.id } })`, `count === 0` → 404 (`:25-27`). Test `route.test.ts:88-104` genuinely mocks `deleteMany` returning `count: 0` for a different user's id and asserts 404 + `{ error: "Not found" }`; a separate test (`:70-86`) asserts the exact `where` object shape. | PASS |
| 3 | `PATCH /api/notifications/read-all` marks ALL unread rows for user+audience, no page limiting, 400 on missing/invalid audience | `route.ts:28-31`: `prisma.notification.updateMany({ where: { userId, audience, isRead: false }, data: { isRead: true } })` — no `skip`/`take`/`id`, confirmed by reading the file directly. 400 returned at `:21-23` when `parseNotificationAudience` returns null (covers both missing and invalid audience — tested at `read-all/route.test.ts:50-74`). Test `:99-118` mocks `count: 42` returned for an audience where "only ~20 could ever have been loaded onto a single page" and asserts the where has no id/page concept — a real beyond-page-1 proof, not just an assertion on the call shape. | PASS |
| 4 | `?audience=ADMIN` bug fix | `list-query.ts:18-24` (`parseNotificationAudience`) accepts `"ADMIN"`; `route.ts` (`GET`) imports and uses it unconditionally at `:25`. Regression test `route.test.ts:147-160` explicitly titled "D9 regression: ?audience=ADMIN actually filters to ADMIN rows only" asserts `findMany` was called with `where` containing `audience: "ADMIN"`. A second test (`:162-175`) confirms TRAVELER/TRIPPER still work (no regression on the existing whitelist). | PASS |
| 5 | Select-all scoped to current page only | `toggleSelectAll` (`RoleNotificationsPageClient.tsx:158-164`) operates only over the `notifications` state array, which holds exactly one page's rows. Test `RoleNotificationsPageClient.test.tsx:213-274` selects all on page 1 (2 rows), navigates to a mocked page 2 (2 different rows), and asserts both page-2 checkboxes render unchecked and the delete button is disabled again. | PASS |
| 6 | Bulk delete = N parallel single-item DELETEs via `Promise.allSettled`, partial-failure banner, selection clears on filter/page change | `handleBulkDelete` (`:214-244`) maps `ids` to individual `fetch(.../${id}, { method: "DELETE" })` inside `Promise.allSettled`; failed count computed from `rejected` results, banner text built from `copy.bulkActions.partialFailure`. Grep of `src/app/api/notifications/` confirms no batch/collection DELETE route exists — only `[id]/route.ts`. `updateStatus`/`handlePageChange` (`:136-145`) both call `setSelectedIds(new Set())`. Tests: partial-failure banner test (`:322-395`) mocks one DELETE succeeding and one failing, asserts the exact bilingual-interpolated banner text renders; selection-clear test (`:276-320`) asserts the delete button disables after a status change. | PASS |
| 7 | Checkbox `stopPropagation` on both `onClick` and `onKeyDown` | `RoleNotificationsPageClient.tsx:388-389`: the row checkbox `<input>` has both `onClick={(e) => e.stopPropagation()}` and `onKeyDown={(e) => e.stopPropagation()}` present, read directly from the JSX — not assumed. Test `:179-211` clicks the checkbox and asserts `fetch` was never called with the mark-read PATCH URL, proving the stopPropagation actually prevents the row's `onClick` handler from firing. | PASS |

## Spec Compliance — `dashboard-shell` delta (unread-dot freshness)

- `src/lib/notifications/unreadDotBus.ts` exists with `subscribeUnreadRefresh`/`publishUnreadRefresh`, matching the design's 12-line module singleton exactly.
- `DashboardUnreadDot.tsx:5,18-33` imports `subscribeUnreadRefresh`, extracts the fetch into a `useCallback refresh`, and subscribes/unsubscribes in a `useEffect` with cleanup.
- Grep of `publishUnreadRefresh` call sites in `RoleNotificationsPageClient.tsx` confirms **all three** mutation paths call it — `markRead` (line 184), `markAllRead` (line 205), and `handleBulkDelete` (line 238). This was checked individually per path, not assumed from one call site.
- Test coverage: `DashboardUnreadDot.test.tsx` asserts a real `publishUnreadRefresh()` call triggers exactly one additional fetch without a remount (lines 40-66), and that an unmounted dot stops refetching (lines 68-89) — a genuine unsubscribe-on-cleanup proof, not just a mock-call-count check.

Status: PASS on both requirements.

## Non-Goals Verification

- No search box: confirmed by reading the full `RoleNotificationsPageClient.tsx` JSX — filter row contains only the status `Select` and the bulk-delete button, no text input.
- No cross-page select-all: confirmed above (Requirement 5) and by design — `toggleSelectAll` only ever sees the current page's array.
- No type/audience filter beyond read status: `Select` options are exactly `all`/`unread`/`read` (lines 289-291); `audience` is a prop, not a user-facing filter control.
- No locked-row concept: no `locked`/`disabled` guard on any row checkbox or delete path in the component or the `DELETE` route.
- `git diff --stat prisma/schema.prisma` → empty (independently re-run, not just trusted from the apply note).
- No batch DELETE endpoint: `fd . src/app/api/notifications -t f` lists only `route.ts`, `[id]/route.ts`, `read-all/route.ts`, `unread-count/route.ts`, `[id]/read/route.ts`, and their `__tests__` — no collection-level DELETE handler anywhere.

All six non-goals hold as documented, deliberate absences — none flagged as gaps.

## Dead Code Removal

- `git status --short` shows `D` (deleted) for all three: `src/components/app/notifications/{NotificationItem,NotificationsList,NotificationsPanel}.tsx`. Confirmed actually deleted from the working tree, not merely modified.
- `rg -n "NotificationsPanel|NotificationsList|NotificationItem" src -g '*.ts' -g '*.tsx'` returns **zero matches** anywhere in `src/` — no stale importer exists (a stale import would have surfaced as a build/typecheck failure, and the fresh `npm run typecheck` run above confirms none did).

## i18n Compliance

- All ~15 new dict keys (`filters.*`, `table.*`, `bulkActions.*`, `emptyStateFiltered`) present in both `src/dictionaries/es.json` (lines 4535-4570) and `src/dictionaries/en.json` (lines 4535-4568) with matching structure and correctly localized values (not machine-duplicated English in the ES file — Spanish strings are genuinely translated, e.g. "Eliminar seleccionadas ({count})", "¿Eliminar {count} notificaciones?").
- `NotificationsDict` interface in `src/lib/types/dictionary.ts:1484-1519` matches both JSON shapes field-for-field (`filters`, `table`, `bulkActions` as nested objects; `emptyStateFiltered` as a top-level sibling to the existing flat `emptyState`).
- `npm run typecheck` passing (re-confirmed this session) is direct evidence the JSON literals structurally satisfy the type — a mismatch here would be a compile error, not a silent gap.

## Spec-Reconciliation Check (Design §"Spec reconciliation for sdd-verify")

Both flagged deviations read as intentional and documented, not violations:

1. **"MUST offer a checkbox column"** realized as a leading checkbox on every `<li>` row plus a tri-state select-all in a header strip above a `<ul>`, not a literal `<table>`/`<td>`. Design D4 gives an explicit, reasoned rationale (matching the *interaction* pattern, not the markup element; converting would discard the icon-puck/unread-tint feed design and triple the diff). Confirmed as a deliberate architecture decision, not an oversight.
2. **"clicks anywhere on the row"** excludes the checkbox itself by design (D4's mandatory `stopPropagation`), which is necessary and correctly implemented per Requirement 7 above — without it, selecting a row would silently mark it read.

Neither is flagged as a gap.

## Findings

No CRITICAL issues. No WARNING issues. No SUGGESTION issues.

Every spec requirement has a direct, verified implementation and a real passing test exercising the exact hazard scenario flagged in the proposal/design as easy to get silently wrong. The four highest-risk items called out in the verification brief (both click-to-mark-read paths, ownership-scoped DELETE with a genuine cross-user 404 test, read-all's beyond-page-1 scoping, the `?audience=ADMIN` regression fix) all check out against the literal code, not inferred from naming or test titles alone.

## Summary

- CRITICAL: 0
- WARNING: 0
- SUGGESTION: 0

**Recommendation: proceed to sdd-archive.**
