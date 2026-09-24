# Tasks: Notifications Inbox (Split View)

Strict TDD is active. Test command: `npm run test` (`vitest run`, config: Vitest + `happy-dom`, `createRoot`/`act`, no RTL — see `RoleNotificationsPageClient.test.tsx` for the harness pattern). Every implementation task is preceded by a RED task that must fail for the stated reason before the matching GREEN task lands. `npm run typecheck` = `tsc -p tsconfig.json --noEmit`; `npm run lint` = `eslint src --max-warnings 0`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950–1,150 original estimate (design.md's own ~950 estimate, ~45% tests). **Superseded**: actual total after Phase 6 was ~2,900+ (see apply-progress.md), and Phase 7's D9 modal rework adds further changes on top — treat 950 as a floor, not a ceiling, confirmed. |
| 400-line budget risk | High |
| Chained PRs recommended | N/A — `delivery_strategy` is fixed at `single-pr` for this change |
| Delivery strategy | single-pr |
| Chain strategy | n/a |
| Decision needed before apply | No — already resolved by the user: single PR, `size:exception` recorded before merge |

**`size:exception` requirement**: this PR exceeds the 400-line budget by design (proposal Risks: "Oversized diff (single PR) — High — Record `size:exception`; slice API before UI inside the PR"; design Migration/Rollout: "Single PR with `size:exception`"). Apply the label/annotation before opening the PR, not after review flags it.

**Approved**: 2026-09-24 — user approved `size:exception` for a single PR before apply.

### Suggested Work Units (commits within the single PR, per `work-unit-commits`)

| Unit | Goal | Depends on | Notes |
|------|------|------|------|
| 0 | Shared types + dictionary type shape | — | Type-only; unblocks typecheck for every later unit |
| 1 | API: `PATCH [id]/read` optional body + `GET [id]` | 0 | Matches design's "commit order: API, then hook, then components, then client and pages" |
| 2 | `useNotificationSelection` hook (anchor math, URL sync, popstate) | 0, 1 (calls `GET [id]`) | Hardest unit — D1/D4/D5 all live here |
| 3 | Presentational components: `NotificationListRow`, `NotificationReadingPane`, `NotificationEmptyPane`, `notificationIcons` | 0, 2 (prop shapes) | No per-role forks |
| 4 | Client integration: `RoleNotificationsPageClient` rewrite + 3 wrappers + 3 server pages | 1, 2, 3 | Where the characterization test gets rewritten |
| 5 | i18n content: `es.json`/`en.json` `pane`/`errors` strings | 0 (type), 3–4 (call sites) | Content-only; type already landed in Unit 0 so typecheck stays green throughout |
| 6 | Cross-cutting verification | all | Full test run, typecheck, lint, manual QA |
| 7 | Split view → modal reading view (D9, user feedback 2026-09-24) | 6 | Post-review pivot; see Phase 7 below |

## Phase 0: Shared Types & Contracts (Unit 0)

- [x] **0.1** Add `NotificationDetailResponse`, `NotificationReadPatchBody`, `NotificationPaneState` to `src/types/notifications.ts` per design.md's Interfaces/Contracts block.
  - Files: `src/types/notifications.ts`
  - Spec: supports notifications-management "Notification Detail Retrieval", "Mark Read or Unread Contract" (response/body shapes referenced by later phases)
  - Done: types compile standalone; no behavior yet, no test required (type-only declarations, no runtime logic to fail red against)

- [x] **0.2** Extend `NotificationsDict` in `src/lib/types/dictionary.ts` with the two new nested objects: `pane: { emptyTitle, emptyBody, notFoundTitle, notFoundBody, loadError, back, markUnread, delete, previous, next, deleteConfirmTitle, deleteConfirmBody }` and `errors: { markReadFailed, markUnreadFailed, deleteFailed }`.
  - Files: `src/lib/types/dictionary.ts`
  - Spec: enables notifications-management "Reading Pane Content and Actions", "Error Surfacing for Pane Actions" (copy contract only — actual es/en strings land in Phase 5)
  - Done: `npm run typecheck` passes; `RoleNotificationsPageClient.test.tsx`'s existing literal `copy` fixture object is still assignable to `NotificationsDict` once it gains the two new keys later in Phase 4 (tracked there, not here)

## Phase 1: API — `PATCH [id]/read` body + `GET [id]` (Unit 1, depends on Phase 0)

- [x] **1.1** RED — create `src/app/api/notifications/[id]/read/__tests__/route.test.ts`: no body → `isRead:true`; `{isRead:false}` → unread; `{isRead:"true"}` (non-boolean) → 400, no `updateMany` call; malformed JSON body → 400, no `updateMany` call; owner match → 200 `{success:true,isRead}`; cross-user id → 404; cross-audience id (once the route accepts `?audience=`) → 404; assert the `where` passed to `updateMany` is `{id, userId, ...(audience && {audience})}` — follow the mocking pattern in `src/app/api/notifications/[id]/__tests__/route.test.ts` (`vi.mock("next-auth")`, `vi.mock("@/lib/prisma")`).
  - Files: `src/app/api/notifications/[id]/read/__tests__/route.test.ts` (new)
  - Spec: notifications-management "Mark Read or Unread Contract" (all 3 scenarios)
  - Done: test file fails against today's route (which ignores the body, uses `findFirst`+`update`, and has no audience scoping) for the stated reasons

- [x] **1.2** GREEN — rewrite `src/app/api/notifications/[id]/read/route.ts` per design D6: read raw body via `request.text()`; empty body → `isRead: true`; invalid JSON or non-boolean `isRead` → 400; otherwise `prisma.notification.updateMany({ where: { id, userId, ...(audience && { audience }) } })`; `count === 0` → 404; success → `200 {success:true, isRead}`.
  - Files: `src/app/api/notifications/[id]/read/route.ts`
  - Spec: notifications-management "Mark Read or Unread Contract"
  - Done: 1.1 passes; no regression in callers that send no body (`RoleNotificationsPageClient`'s current `markRead`/`markAllRead` calls — verified in Phase 4, not here)

- [x] **1.3** RED — extend `src/app/api/notifications/[id]/__tests__/route.test.ts` with a `describe("GET /api/notifications/[id]")` block: 401 no session; 400 missing or invalid `audience` query param; 404 cross-user id; 404 cross-audience id; 200 `{notification}` shaped via `toClientNotification`; assert zero calls to any `update`/`updateMany`/`delete` mock (no side effects) for a successful GET.
  - Files: `src/app/api/notifications/[id]/__tests__/route.test.ts`
  - Spec: notifications-management "Notification Detail Retrieval" (both scenarios)
  - Done: fails today — the route file has no `GET` export

- [x] **1.4** GREEN — add `GET` to `src/app/api/notifications/[id]/route.ts`: validate `audience` via `parseNotificationAudience`, `prisma.notification.findFirst({ where: { id, userId, audience } })`, `null` → 404 `{error:"Not found"}`, else `200 {notification: toClientNotification(row)}`.
  - Files: `src/app/api/notifications/[id]/route.ts`
  - Spec: notifications-management "Notification Detail Retrieval"
  - Done: 1.3 passes; existing `DELETE` tests in the same file still pass unmodified

- [x] **1.5** Verify: `npm run test -- src/app/api/notifications` and `npm run typecheck` clean for Phase 1 scope.

## Phase 2: `useNotificationSelection` hook (Unit 2, depends on Phase 0–1)

- [x] **2.1** RED — create `src/components/app/dashboard/shared/notifications/__tests__/useNotificationSelection.test.tsx` with a small harness component (per design's Testing Strategy table): anchor resolves `idx±1` when the selected item is still in the list; after the item leaves the list (unread-filter case), `prev = list[anchor-1]` / `next = list[anchor]`; `next` is `undefined`/disabled at the end of the list; anchor resets to `null` on page or status change (Prev/Next disabled); `open(id, "push")` calls `window.history.pushState` (spy on `history`), `step`/delete-advance/deep-link cleanup call `replaceState`; a `popstate` event re-resolves `id` from the list, then the snapshot, then a mocked `GET [id]`; `close()` calls `history.back()` only when this session pushed the entry, otherwise `replaceState` without `id`.
  - Files: `src/components/app/dashboard/shared/notifications/__tests__/useNotificationSelection.test.tsx` (new)
  - Spec: notifications-management "URL-Addressable Selection" (all 3 scenarios), "Prev/Next stay within the current page's order", "Unread filter keeps the pane open when the row leaves the list"
  - Done: fails — the hook module does not exist yet

- [x] **2.2** GREEN — create `src/components/app/dashboard/shared/notifications/useNotificationSelection.ts` implementing D1 (anchor math), D4 (`pushState`/`replaceState`/`popstate`/`back()` rules), D5 (list → snapshot → `GET [id]` resolution order, 404 → `notFound` pane state).
  - Files: `src/components/app/dashboard/shared/notifications/useNotificationSelection.ts` (new)
  - Spec: same as 2.1
  - Done: 2.1 passes

- [x] **2.3** REFACTOR — if the hook body exceeds ~120 lines, extract the anchor-math computation into a small pure function in the same file (not a new file — it has no other consumer). No behavior change; 2.1 must stay green.

- [x] **2.4** Verify: `npm run test -- useNotificationSelection` and `npm run typecheck` clean.

## Phase 3: Presentational components (Unit 3, depends on Phase 0, 2)

- [x] **3.1** Move `TYPE_ICONS` and `DANGER_TYPES` out of `RoleNotificationsPageClient.tsx` verbatim into `src/components/app/dashboard/shared/notifications/notificationIcons.ts`. No behavior change — leave the old client importing from the new module until Phase 4 replaces it wholesale.
  - Files: `src/components/app/dashboard/shared/notifications/notificationIcons.ts` (new)
  - Spec: none directly — refactor-only, enables 3.3/3.5
  - Done: no test needed (pure data move); `npm run typecheck` clean

- [x] **3.2** RED — create `.../notifications/__tests__/NotificationListRow.test.tsx`: whole-row click/keyboard activation fires `onOpen` for both an href-bearing and an href-less notification; clicking the checkbox does not call `onOpen` (stopPropagation on click and keydown); the unread dot renders only when unread, with an `sr-only` label from `copy.unreadBadge`; the row's button carries `aria-current` reflecting the `selected` prop.
  - Files: `src/components/app/dashboard/shared/notifications/__tests__/NotificationListRow.test.tsx` (new)
  - Spec: notifications-management "Opening any row marks it read" (row-level trigger, not the PATCH itself — that's Phase 4's integration test)
  - Done: fails — component does not exist

- [x] **3.3** GREEN — create `NotificationListRow.tsx` with props `{notification, selected, checked, copy, locale, onOpen, onToggleChecked}` per design's Layout/A11y section (checkbox as sibling of a `<button type="button" aria-current>` covering icon puck/title/one-line `truncate` preview/time; unread dot `h-2 w-2 rounded-full bg-primary` + `sr-only`).
  - Files: `src/components/app/dashboard/shared/notifications/NotificationListRow.tsx` (new)
  - Spec: same as 3.2
  - Done: 3.2 passes

- [x] **3.4** RED — create `.../notifications/__tests__/NotificationReadingPane.test.tsx`: renders icon/title/timestamp/full body plus a CTA (`Button asChild` wrapping `Link`) when `href` is non-null; omits the CTA when `href` is null; "Mark unread" fires `onToggleRead`; Prev/Next respect `canPrev`/`canNext`/`busy` disabled flags; Delete opens `ConfirmModal` and fires `onDelete` only on confirm; Esc does not trigger `onBack`/close while the confirm modal is open.
  - Files: `src/components/app/dashboard/shared/notifications/__tests__/NotificationReadingPane.test.tsx` (new)
  - Spec: notifications-management "Pane shows full detail and CTA", "Mark unread reverts read state", "Delete advances to the next item", "Prev/Next stay within the current page's order"
  - Done: fails — component does not exist

- [x] **3.5** GREEN — create `NotificationReadingPane.tsx` with props `{notification, href, copy, locale, canPrev, canNext, busy, onPrev, onNext, onToggleRead, onDelete, onBack}` per design's Layout/A11y (`text-xl font-semibold text-ink` heading, `tabIndex={-1}` focused on open; absolute time via `Intl.DateTimeFormat(locale, {dateStyle:"medium", timeStyle:"short"})`, per D8).
  - Files: `src/components/app/dashboard/shared/notifications/NotificationReadingPane.tsx` (new)
  - Spec: same as 3.4
  - Done: 3.4 passes

- [x] **3.6** RED — create `.../notifications/__tests__/NotificationEmptyPane.test.tsx`: renders the correct copy for `variant="empty"|"notFound"|"error"`; renders a Back control that fires `onBack` when the prop is passed, and omits it when absent.
  - Files: `src/components/app/dashboard/shared/notifications/__tests__/NotificationEmptyPane.test.tsx` (new)
  - Spec: notifications-management "Desktop shows an empty pane with no selection", "Invalid, foreign, or wrong-audience id shows 404 empty state"
  - Done: fails — component does not exist

- [x] **3.7** GREEN — create `NotificationEmptyPane.tsx` with props `{variant, copy, onBack?}`.
  - Files: `src/components/app/dashboard/shared/notifications/NotificationEmptyPane.tsx` (new)
  - Spec: same as 3.6
  - Done: 3.6 passes

- [x] **3.8** Verify: `npm run test -- notifications/` and `npm run typecheck` clean for Phase 3 scope.

## Phase 4: Client integration (Unit 4, depends on Phase 1–3)

- [x] **4.1** RED — rewrite the two "click-to-mark-read preservation" tests in `RoleNotificationsPageClient.test.tsx` (`fires PATCH .../read when clicking an href-less unread row`, `... when clicking the action link on an href-bearing unread row`) into "row click marks read", asserting on the new row markup (open via `NotificationListRow`'s button, not the old `[role=button]`/bare `<a>` DOM), per design.md Testing Strategy note: "Rewrite the existing characterization test 'action link click marks read' as 'row click marks read'." Both must still assert the same `PATCH /api/notifications/[id]/read` call for href and href-less rows — there is no icon-only path anymore.
  - Files: `src/components/app/dashboard/shared/__tests__/RoleNotificationsPageClient.test.tsx`
  - Spec: notifications-management "Opening any row marks it read" (replaces "Preserve Click-to-Mark-Read Semantics")
  - Done: fails against the current (pre-rewrite) component for the new selectors/expectations

- [x] **4.2** RED — add integration tests to the same file: opening a row marks it read and calls `publishUnreadRefresh()` (mock the bus module); under `status=unread`, opening a row keeps the pane open on that item after the row leaves the refetched list, and clicking Next opens `list[anchor]` (D1); confirming delete advances the pane to the next item, or clears the selection and shows the empty pane when there is no next item (D2); a failed mark-unread/delete/detail-fetch shows a `sonner` `toast.error(...)` (mock `sonner`) and rolls back any optimistic UI change; passing `initialSelectedId` for an id not present in `initialNotifications` triggers a `GET [id]` fetch instead of a list lookup.
  - Files: `src/components/app/dashboard/shared/__tests__/RoleNotificationsPageClient.test.tsx`
  - Spec: notifications-management "Delete advances to the next item", "Prev/Next stay within the current page's order", "Unread filter keeps the pane open when the row leaves the list", "Error Surfacing for Pane Actions", "Deep link to an off-page id fetches detail"; dashboard-shell "Unread dot refreshes after marking a notification unread"
  - Done: fails — none of this wiring exists in the current component

- [x] **4.3** GREEN — rewrite `RoleNotificationsPageClient.tsx`: consume `useNotificationSelection`; render the `lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6` split (list column + `lg:sticky lg:top-24` pane column), with `hidden lg:block` toggling per design's mobile rules; render `NotificationListRow`/`NotificationReadingPane`/`NotificationEmptyPane`; remove `TableIconLink`, the inline click-to-mark-read `onClick`/`onKeyDown`/`role`/`tabIndex` logic, and the now-unused local `TYPE_ICONS`/`DANGER_TYPES` (superseded by `notificationIcons.ts`); add the `initialSelectedId` prop; wire `toast.error(copy.errors.*)` from `sonner` on mutation failures with optimistic rollback (D7); keep the existing filter/pagination/bulk-delete/`ConfirmModal` behavior intact (untouched by this change).
  - Files: `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx`
  - Spec: notifications-management "Opening any row marks it read", "Mobile pane replaces the list", "Desktop shows an empty pane with no selection", "Error Surfacing for Pane Actions"; dashboard-shell "Unread dot refreshes after marking a notification unread" (mark-unread wired to `publishUnreadRefresh()`)
  - Done: 4.1 and 4.2 pass; the pre-existing filter/pagination/bulk-delete tests in the same file still pass unmodified

- [x] **4.4** Modify the 3 role server pages — `src/app/[locale]/(secure)/dashboard/{admin,traveler,tripper}/notifications/page.tsx`: read `sp.id` and pass it through as `initialSelectedId` (string or `undefined`) to the client. Do not add a new Prisma query for the id — off-page resolution happens client-side via `GET [id]` (D5).
  - Files: 3 `notifications/page.tsx` files
  - Spec: notifications-management "Reload restores an on-page selection", "Deep link to an off-page id fetches detail"
  - Done: `npm run typecheck` clean; each page still passes its existing props unchanged otherwise

- [x] **4.5** Modify the 3 pass-through wrapper clients — `AdminNotificationsPageClient.tsx`, tripper's `NotificationsPageClient.tsx`, `TravelerNotificationsPageClient.tsx`: widen the prop type with `initialSelectedId` and keep the `{...props}` spread into `RoleNotificationsPageClient`. Mechanical, no new logic — no dedicated test (matches the precedent in `notifications-filter-and-bulk-delete` tasks.md B1.9); covered indirectly by 4.2's `initialSelectedId` assertions on the shared client.
  - Files: 3 wrapper client files
  - Spec: notifications-management "Reload restores an on-page selection"
  - Done: `npm run typecheck` clean

- [x] **4.6** Verify: `npm run test` (full suite) and `npm run typecheck` clean for Phase 4 scope.

## Phase 5: i18n content (Unit 5, depends on Phase 0's type + Phase 3–4's call sites)

- [x] **5.1** Add the real `pane` and `errors` string content to `notifications` in both `src/dictionaries/es.json` and `src/dictionaries/en.json`: `pane.{emptyTitle, emptyBody, notFoundTitle, notFoundBody, loadError, back, markUnread, delete, previous, next, deleteConfirmTitle, deleteConfirmBody}` and `errors.{markReadFailed, markUnreadFailed, deleteFailed}`. Both locale files get every key — no exceptions, per `i18n-and-types.md`.
  - Files: `src/dictionaries/es.json`, `src/dictionaries/en.json`
  - Spec: notifications-management "Reading Pane Content and Actions" (copy for pane controls), "Error Surfacing for Pane Actions", "Responsive Pane Layout" (empty-state copy), "Invalid, foreign, or wrong-audience id shows 404 empty state" (not-found copy)
  - Done: both files have identical key sets under `notifications.pane` and `notifications.errors`; no placeholder/English-in-es or Spanish-in-en leakage

- [x] **5.2** Grep both dictionaries for `notifications.pane`/`notifications.errors` key parity (`rg` on both files, diff the key lists) to catch a typo'd or missing key before typecheck (which won't catch JSON-content drift — see note below).
  - Files: none (verification step)
  - Spec: same as 5.1
  - Done: identical key sets confirmed

- [x] **5.3** Verify: `npm run typecheck` clean. Note: TypeScript will not catch a missing `es.json`/`en.json` key on its own — `getDictionary()` casts the parsed JSON to `MarketingDictionary` without structural validation (`src/lib/i18n/dictionaries.ts`). 5.2's manual key-parity check and Phase 6's manual QA are what actually catch a missing string.

## Phase 6: Cross-cutting verification (Unit 6)

- [x] **6.1** Full `npm run test` (all suites, new and pre-existing) green.
- [x] **6.2** `npm run typecheck` clean.
- [x] **6.3** `npm run lint` clean for this change's touched files (`npx eslint` on all 22 changed/untracked `.ts`/`.tsx` files: 0 errors, 0 warnings). Repo-wide `npm run lint` still reports 62 pre-existing errors across ~35 files this change never touches (baseline debt on `develop`, unrelated to this change — see apply-progress.md).
- [x] **6.4** Confirm `git diff prisma/schema.prisma` is empty — no migration (per design.md Migration/Rollout: "No migration").
- [ ] **6.5** Manual QA (superseded by D9 — updated for the modal reading view, see Phase 7):
  - [ ] Desktop ≥1280px: the list stays full width; opening a row opens a centered modal (not a side pane); the list underneath is never hidden.
  - [ ] Mobile ≥360px: opening a row opens a full-screen modal; the hardware/browser back button (not just the dialog's own close X) closes it and clears `?id=` without a full page reload.
  - [ ] Unread filter: open an unread row (it leaves the filtered list on refetch), confirm the dialog stays open on it, then click Next/Prev and confirm it resolves against the pre-refetch order, not the new filtered list.
  - [ ] Deep link: paste a `?id=X` URL for an item not on the loaded page, reload, confirm the dialog opens and fetches/renders it via `GET [id]` without changing the loaded list page.
  - [ ] Cross-audience/cross-user: manually edit `?id=` to another user's or another audience's notification id, confirm the dialog opens showing a localized 404 empty state — not the item's content.
  - [ ] es/en copy: switch locale and confirm every pane/error string (including the dialog's close aria-label) renders localized text, not an `undefined`/key-name fallback, in both languages.
  - [ ] Nested modal: open a notification, click Delete, confirm the delete-confirmation modal renders on top of the reading dialog and Esc dismisses only the confirmation, not both.
- [ ] **6.6** Confirm `size:exception` is recorded on the PR (per Review Workload Forecast) before requesting review.

## Phase 7: Split view → modal reading view (user feedback 2026-09-24, D9, Unit 7)

The user reviewed the shipped split view and said it "looks weird." Replaced with a Radix dialog reading view. `useNotificationSelection`, the API, i18n structure, and mark-read/unread semantics are unchanged — see design.md's D9 for the full decision record.

- [x] **7.1** RED — write `NotificationDialog.test.tsx` against a not-yet-existing module: renders render-prop content when `open`; not rendered when closed; no split-grid/sticky classes present; close button calls `onClose`; Esc calls `onClose`.
  - Files: `src/components/app/dashboard/shared/notifications/__tests__/NotificationDialog.test.tsx` (new)
  - Spec: notifications-management "Reading Dialog Layout" (new requirement, replaces "Responsive Pane Layout")
  - Done: fails — the module does not exist yet
- [x] **7.2** GREEN — create `NotificationDialog.tsx`: Radix `Dialog`/`DialogContent` shell, `showCloseButton={false}` + custom localized `DialogClose`, mobile-first-full-screen/`sm:`-centered classes, sr-only `DialogTitle`/`DialogDescription` (props `title`/`description`) for `aria-labelledby`/`aria-describedby`, `onOpenAutoFocus` focusing a `titleRef` forwarded via a render-prop `children`.
  - Files: `src/components/app/dashboard/shared/notifications/NotificationDialog.tsx` (new)
  - Spec: same as 7.1
  - Done: 7.1 passes; also added an accessible-title/description test (aria-labelledby/describedby resolve to the right text) — passed on the same implementation
- [x] **7.3** Remove `NotificationReadingPane`'s `onBack` prop, manual `onKeyDown` Escape handler, manual focus `useEffect`, and mobile-only Back button; add a `titleRef` prop attached to its (unchanged, plain — not a Radix `DialogTitle`) visible `<h2>`; restructure into a fixed header/footer with a `min-h-0 flex-1 overflow-y-auto` scrollable body. Update its test: remove the two Esc-behavior tests (that behavior now belongs to `NotificationDialog`), add a `titleRef`-attachment test.
  - Files: `src/components/app/dashboard/shared/notifications/NotificationReadingPane.tsx` (+ test)
  - Spec: notifications-management "Reading Pane Content and Actions" (content/actions unchanged), "Reading Dialog Layout" (chrome changed)
  - Done: all pre-existing content/action tests still pass unmodified; new `titleRef` test passes
- [x] **7.4** Remove `NotificationEmptyPane`'s `"empty"` variant, `onBack` prop, and Back button; add `titleRef`. Update its test: remove the `empty`-variant and `onBack` tests, add a `titleRef`-attachment test.
  - Files: `src/components/app/dashboard/shared/notifications/NotificationEmptyPane.tsx` (+ test)
  - Spec: notifications-management "Reading Dialog Layout" (no more desktop empty-pane scenario)
  - Done: notFound/error variant tests still pass; `empty` variant no longer exists at the type level
- [x] **7.5** Rewrite `RoleNotificationsPageClient.tsx`: remove the `lg:grid`/`hidden lg:block` split-grid wrapper (list is always full width); replace the sticky pane column with `<NotificationDialog open={selectedId !== null} onClose={selection.close} title=... description=...>` rendering `NotificationReadingPane`/`NotificationEmptyPane`/a transient loading placeholder via the render-prop. Update its test: pane-content assertions now query `document.body` (Radix portals there, not into `container`); add tests for dialog-opens-on-row-click, closes-via-close()-on-X, closes-via-close()-on-Esc, notFound-renders-inside-dialog, no-split-grid, and Esc-closes-only-the-topmost-nested-dialog.
  - Files: `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` (+ test)
  - Spec: notifications-management "Reading Dialog Layout"
  - Done: all pre-existing row-click/bulk-delete/pagination tests pass unmodified; 6 new dialog tests pass
- [x] **7.6** Remove `pane.emptyTitle`/`pane.emptyBody`/`pane.back` (dead after 7.3/7.4) from `dictionary.ts`, `es.json`, `en.json`; add `pane.closeAriaLabel` (es: "Cerrar", en: "Close") to all three. Verify key parity.
  - Files: `src/lib/types/dictionary.ts`, `src/dictionaries/es.json`, `src/dictionaries/en.json`
  - Spec: notifications-management "Reading Dialog Layout" (close control needs an accessible label)
  - Done: `pane` key sets identical between es/en; `npm run typecheck` clean
- [x] **7.7** Verify: `npm run test` (full suite), `npm run typecheck`, `npx eslint` on every changed/untracked `.ts`/`.tsx` file in this change (0 errors, 0 warnings, no `eslint-disable` — this also required removing the two remaining pre-existing `eslint-disable-next-line react-hooks/exhaustive-deps` comments from the earlier lint-driven fix, using a ref-guarded dependency array in `useNotificationSelection.ts`'s mount effect and an accepted-extra-no-op-runs `selection` dependency in the delete-advance effect).
  - Files: none (verification step)
  - Spec: n/a
  - Done: 363 test files / 3862 tests pass; typecheck clean; `npx eslint` on all 24 changed/untracked files: 0 errors, 0 warnings, 0 `eslint-disable` comments
- [x] **7.8** RED then GREEN — remove the per-type icon puck (folded into D9, same review): user asked to remove "that check icon" from the list and the modal, for all notification types, not just check-mark ones. Added a failing test to `NotificationListRow.test.tsx` (`button[aria-current] svg` must be null) and `NotificationReadingPane.test.tsx` (no `.h-11.w-11` element — the puck's unique size class), confirmed both RED against the then-current implementation, then removed the icon `<span>` puck, the `TYPE_ICONS`/`DANGER_TYPES`/`Icon`/`isDanger` usages, and the now-unused `Bell`/`cn` imports from both components. Deleted `notificationIcons.ts` outright once it had zero remaining consumers (no dead code left behind — it never had its own test file). Kept the unread dot, the toolbar's `CheckCheck` "Mark all read" button, and the row selection checkbox untouched.
  - Files: `src/components/app/dashboard/shared/notifications/NotificationListRow.tsx` (+ test), `src/components/app/dashboard/shared/notifications/NotificationReadingPane.tsx` (+ test); deleted `src/components/app/dashboard/shared/notifications/notificationIcons.ts`
  - Spec: notifications-management "Reading Pane Content and Actions" (no per-type icon)
  - Done: both new tests pass; all pre-existing tests in both files still pass unmodified; full suite (363 files / 3864 tests) green; typecheck clean; `npx eslint` on all 23 changed/untracked files: 0 errors, 0 warnings, 0 `eslint-disable`
- [x] **7.9** RED then GREEN — give the reading dialog's body more breathing room (folded into D9, same review): the user reported the bottom action buttons (Mark unread/Delete/Prev/Next/CTA) looked crammed right under the message text. Added a failing test to `NotificationReadingPane.test.tsx` asserting the scrollable body has a `sm:min-h-(48–64)` class and the footer has both `mt-6` and `pt-4`, confirmed RED against the then-current classes, then added `sm:min-h-56` to the body wrapper (desktop-only — mobile is already full-screen `flex-1`, plenty of room) and `mt-6` to the footer (on top of its existing `border-t border-gray-200 pt-4`). Both are standard Tailwind scale utilities, no arbitrary values. The existing `flex-1`/`min-h-0`/`overflow-y-auto` body + bounded-height `NotificationDialog` (mobile `h-full`, desktop `sm:max-h-[85vh]`) already correctly scrolls long messages without pushing the footer off-screen — confirmed unchanged, not re-implemented.
  - Files: `src/components/app/dashboard/shared/notifications/NotificationReadingPane.tsx` (+ test)
  - Spec: notifications-management "Reading Dialog Layout" (visual refinement, no new requirement text)
  - Done: new test passes; all 8 pre-existing tests in the file still pass unmodified; full suite (363/3865) green; typecheck clean; `npx eslint` on all 23 changed/untracked files: 0 errors, 0 warnings, 0 `eslint-disable`
- [ ] **7.10** Update Phase 6's manual QA checklist (6.5, above) for the modal reading view (removed icon puck, body spacing) and re-run it — **pending-human**.
