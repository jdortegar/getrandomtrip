# Design: Notifications Inbox (Split View)

## Technical Approach

Keep `RoleNotificationsPageClient` as the single stateful container for all three roles. Move selection, URL, and pane logic into a `useNotificationSelection` hook, and move rendering into three presentational components. The API gets two additive changes: an optional `{ isRead }` body on `PATCH [id]/read`, and a new `GET [id]`. Each server page passes `initialSelectedId` from `searchParams.id`, so the client never calls `useSearchParams`. There are no schema changes and no new routes.

## Architecture Decisions

| # | Topic | Choice | Rejected | Rationale |
|---|-------|--------|----------|-----------|
| D1 | Unread-filter edge case | The pane renders `selected: ClientNotification` (a snapshot kept separately from `notifications`). Prev/Next uses an **insertion anchor**. If the selected item is in the list, neighbors are `idx±1` and `anchor = idx`. If it has left the list, `prev = list[anchor-1]` and `next = list[anchor]`. Post-mutation refetches keep the anchor. Page or status changes reset it to `null`, which disables Prev/Next. Prev/Next are also disabled while `loading`. | Keep a frozen id-order snapshot plus an item map (more state, and it drifts from the server); leave the read row in the unread list until the user refreshes, Gmail-style (contradicts the proposal/spec delta and makes counts wrong) | Removing a row moves its successor into the same index, so `list[anchor]` is exactly "next" without extra bookkeeping. Known limit: a new arrival at the top shifts the anchor by one. |
| D2 | Delete from pane | After a successful DELETE, refetch the list. Then open `list[anchor]` (replace, marks read). If that slot is empty, clear `?id=`. Remove the id from `selectedIds`. | Always close the pane; select the previous item | Email-client convention; reuses the D1 anchor. |
| D3 | URL state | `?id=` only. `status` and `page` stay local, which matches today's behavior. | Mirror status/page into the URL | The server pages already read `sp.status/page`, but nothing writes them. Syncing them is scope creep. |
| D4 | `?id=` sync | Use the native `window.history.pushState` / `replaceState` (supported by Next 16's App Router, no RSC round-trip). Opening from the list uses **push**. Prev/Next, delete-advance, and deep-link cleanup use **replace**. Close: if this session pushed the entry, call `history.back()`, otherwise `replaceState` without `id`. A `popstate` listener re-reads `id` from `location` and resolves it from the list, the snapshot, or `GET [id]`. | `router.push/replace` (re-runs the server page's three Prisma queries on every click); `useSearchParams` (needs mocks in tests and a Suspense boundary) | Mobile hardware back returns to the list. Prev/Next does not flood the history stack. |
| D5 | Detail source | Use the list item, then the current snapshot, then `GET /api/notifications/[id]?audience=`. A 404 shows `NotificationEmptyPane variant="notFound"`. | Seed the item from the server page | GET is still needed for popstate and forward navigation. Keeps the pages thin. |
| D6 | PATCH contract | Read the raw body with `request.text()`. An empty body means `isRead: true`. Invalid JSON, or an `isRead` that is present but not a boolean, returns 400. The route uses `updateMany({ where: { id, userId, ...(audience && { audience }) } })`; `count === 0` returns 404. The client always sends `?audience=`. | New `PATCH [id]` | Backward compatible. Keeps the same ownership style as DELETE. |
| D7 | Errors | Mutation failures (open-mark-read, toggle, delete) call `toast.error(copy.errors.*)` from `sonner`. The `<Toaster/>` is already mounted in `[locale]/layout.tsx`. Optimistic updates roll back. Detail load failure shows inline pane microcopy. Bulk partial failure keeps its existing inline `<p>`. | Inline error slot per action | The row or pane may already have moved on, so a toast survives the re-render. |
| D8 | Relative time | Keep `date-fns` `formatDistanceToNow`, as the current code does, for list rows. The pane shows the absolute time with `Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })`. | `Intl.RelativeTimeFormat` (proposal) | Already locale-aware and already a dependency. Avoids hand-rolling unit selection. |
| D9 | Split view → modal (user feedback 2026-09-24) | The user saw the shipped split view and said it "looks weird." Replaced with a Radix dialog (`src/components/ui/dialog.tsx`) rendering `NotificationReadingPane`'s content: centered modal (`sm:max-w-2xl`, `sm:max-h-[85vh]`, internally scrollable body) on `sm+`, full-screen below `sm`. The list column drops the `lg:grid`/`hidden lg:block` toggling entirely — it's always full width, never hidden. `useNotificationSelection` (D1/D2/D4/D5, `onResolved`) is unchanged; only the *rendering* of `selected`/`paneState` changed, from a sticky pane to a dialog gated on `selectedId !== null`. `NotificationEmptyPane`'s `empty` (nothing-selected) variant is deleted — there is nothing to render when the dialog isn't open, so that state no longer exists. Radix owns the focus trap, Esc, outside-click dismissal, and focus return; the pane's own manual `onKeyDown` Escape handler and mobile-only "Back" button are deleted as duplicates. A new `NotificationDialog.tsx` owns the Radix shell (Dialog/DialogContent/DialogClose, a sr-only `DialogTitle`/`DialogDescription` pair for `aria-labelledby`/`aria-describedby`, and `onOpenAutoFocus` focusing the pane's own visible heading via a forwarded `titleRef`) as a render-prop wrapper, so `NotificationReadingPane`/`NotificationEmptyPane` stay plain, Dialog-context-free, and independently unit-testable exactly as before. **Folded in (same review, same day)**: the user also asked to remove "that check icon" — the per-type icon puck (`TYPE_ICONS[type] ?? Bell`, with `DANGER_TYPES`-driven red/sage coloring) — from both `NotificationListRow` and `NotificationReadingPane`, for every notification type, not just the check-mark ones. Removed from both; `DANGER_TYPES`/`isDanger` styling had no other purpose, so it went with it. `notificationIcons.ts` (which only ever exported `TYPE_ICONS`/`DANGER_TYPES`) became fully unused and was deleted outright — no dead code left behind. The unread dot, the toolbar's "Mark all read" `CheckCheck` button, and the row's selection checkbox are unrelated UI elements and were explicitly kept. | Keep the split view and just restyle it (user explicitly rejected the layout, not the visuals); make `NotificationReadingPane`/`NotificationEmptyPane` themselves render `DialogTitle`/`DialogDescription` directly (would require every existing standalone unit test to wrap renders in a real `<Dialog>` context, since Radix's `Dialog.Title`/`Description` throw outside one — the sr-only-pair-in-the-wrapper approach avoids that entirely); keep the icon puck for non-danger types only (user asked for removal across all types, for consistency, not a partial rollback) | Radix's `DismissableLayer` stacking already isolates Esc/outside-click per nested dialog instance, so the delete-confirm modal nesting inside the reading dialog needs no custom code — verified by a test asserting Esc closes only the topmost of two open `[data-slot="dialog-content"]` elements. |

## Data Flow

    page.tsx (sp.id) ─→ RoleNotificationsPageClient ─→ useNotificationSelection
                           │ list/status/page state        │ selected, anchor, open/step/close
                           ├─ NotificationListRow ×N ──click─→ open(id, "push")
                           └─ NotificationReadingPane ─→ markRead/markUnread/delete/step
     open(id): snapshot ← list item | GET [id]; if unread → PATCH {isRead:true}
               → publishUnreadRefresh() → status==="unread" ? refetch : patch in place

## Layout / A11y

_Superseded by D9 (2026-09-24) — kept below for history; current layout follows D9._

- ~~Wrapper: `lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6`.~~ ~~The pane is `lg:sticky lg:top-24`.~~ ~~Below `lg`: when `selectedId` is set, the filter row, list, and pagination get `hidden lg:block`.~~ ~~Pane shows a Back `Button variant="ghost"`.~~
- Row: the checkbox is a sibling of a `<button type="button" aria-current={selected}>` that covers the title, one-line `truncate` preview, and time. The unread dot is `h-2 w-2 rounded-full bg-primary` plus `sr-only {copy.unreadBadge}`. `TableIconLink` is removed. **The per-type icon puck (e.g. `CircleCheck` for approved) is also removed** — user feedback 2026-09-24, folded into D9 below.

### Current layout (D9 — modal)

- List: always full width — `<div className="space-y-6 text-left">` with no `lg:grid`/`hidden` toggling of any kind. The filter row, list, and pagination are always visible regardless of selection.
- `NotificationDialog` (new): `<Dialog><DialogContent>` with `showCloseButton={false}` and a custom `<DialogClose aria-label={copy.pane.closeAriaLabel}>` (localized — the shared primitive's built-in close button hardcodes English "Close" `sr-only` text, so a custom one is used here, matching `DocumentDraftPanel.tsx`'s precedent for `showCloseButton={false}` + a custom close). Classes: mobile-first full-screen (`inset-0 h-full w-full max-w-full rounded-none`), `sm:` centered (`sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl`). A sr-only `DialogTitle`/`DialogDescription` pair (props `title`/`description`, computed by the caller from `selected`/`paneState`/`loadError`) satisfies Radix's `aria-labelledby`/`aria-describedby` wiring. `onOpenAutoFocus` calls `event.preventDefault()` and focuses a `titleRef` forwarded to whichever content the render-prop returns.
- Pane content (`NotificationReadingPane`, content/actions otherwise unchanged, chrome changed): header (`<h2 ref={titleRef} tabIndex={-1}>title</h2>` + absolute time — **no more icon puck**, removed per the same 2026-09-24 feedback) and footer actions (Mark unread, Delete, Prev/Next) are fixed; the body (notification text + CTA) is `min-h-0 flex-1 overflow-y-auto sm:min-h-56` so long messages scroll inside the modal without resizing it, and short ones don't leave the footer crammed right under the text on desktop (`sm:min-h-56` is a follow-up, same review, user-requested — mobile stays plain `flex-1` since full-screen already gives the body ample room). The footer gains `mt-6` on top of its existing `border-t border-gray-200 pt-4` for clearer separation, same follow-up. No more manual `onKeyDown` Escape handler and no more mobile-only Back button — Radix's Esc/outside-click/focus-trap/focus-return supersede both.
- `NotificationEmptyPane` (notFound/error only — `empty` variant deleted): renders inside the same dialog shell when `?id=` can't be resolved or fails to load; also takes `titleRef` for the same auto-focus wiring, no more `onBack` prop.
- CTA unchanged: `<Button asChild>` wrapping a `Link` (`actionView` or `actionReview`).

## File Changes

| File | Action |
|------|--------|
| `src/app/api/notifications/[id]/read/route.ts` | Modify (D6) |
| `src/app/api/notifications/[id]/read/__tests__/route.test.ts` | Create |
| `src/app/api/notifications/[id]/route.ts` (+ existing test) | Modify: add GET |
| `src/components/app/dashboard/shared/notifications/useNotificationSelection.ts` | Create |
| `src/components/app/dashboard/shared/notifications/NotificationDialog.tsx` (+ test) | **Create (D9)** — Radix dialog shell, render-prop wrapper |
| `src/components/app/dashboard/shared/notifications/{NotificationListRow,NotificationReadingPane,NotificationEmptyPane}.tsx` | Create (Reading/EmptyPane **revised under D9**: no more `onBack`/manual Esc/manual focus effect; `titleRef` prop added; EmptyPane's `empty` variant deleted) |
| `src/components/app/dashboard/shared/notifications/notificationIcons.ts` | Create (`TYPE_ICONS`, `DANGER_TYPES` moved out of the client), then **Delete (D9)** — the per-type icon puck that consumed it was removed per user feedback, leaving it with zero consumers |
| `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` (+ test) | Modify (**revised under D9**: split-grid removed, `NotificationDialog` render-prop replaces the sticky pane column) |
| 3 wrappers + 3 `notifications/page.tsx` | Modify: `initialSelectedId` |
| `src/types/notifications.ts`, `src/lib/types/dictionary.ts`, `src/dictionaries/{es,en}.json` | Modify (**revised under D9**: `pane.emptyTitle`/`pane.emptyBody`/`pane.back` removed, `pane.closeAriaLabel` added) |

## Interfaces / Contracts

```ts
// src/types/notifications.ts
export interface NotificationDetailResponse { notification: ClientNotification }
export interface NotificationReadPatchBody { isRead?: boolean }
export type NotificationPaneState = "empty" | "loading" | "ready" | "notFound";
```

- `GET /api/notifications/[id]?audience=X` returns 401, 400 (bad or missing audience), 404 (`{ error: "Not found" }`, scoped by `findFirst({ id, userId, audience })`), or 200 `NotificationDetailResponse` via `toClientNotification`.
- `PATCH [id]/read` returns 200 `{ success: true, isRead }`. No caller reads the body today.
- Props (**revised under D9**): `NotificationListRow { notification, selected, checked, copy: NotificationsDict, locale, onOpen, onToggleChecked }` (unchanged). `NotificationReadingPane { notification, href, copy, locale, canPrev, canNext, busy, onPrev, onNext, onToggleRead, onDelete, titleRef: RefObject<HTMLHeadingElement | null> }` — `onBack` removed. `NotificationEmptyPane { variant: "notFound" | "error", copy, titleRef }` — `"empty"` and `onBack?` removed. `NotificationDialog { open, onClose, closeAriaLabel, title, description, children: (titleRef) => ReactNode }` — new.

**Dictionary** (`NotificationsDict.pane` **revised under D9**; es and en are both required):
`pane: { notFoundTitle, notFoundBody, loadError, closeAriaLabel, markUnread, delete, previous, next, deleteConfirmTitle, deleteConfirmBody }` (`emptyTitle`/`emptyBody`/`back` removed, `closeAriaLabel` added) and `errors: { markReadFailed, markUnreadFailed, deleteFailed }` (unchanged). The pane reuses `markRead`, `actionView`, `actionReview`, `unreadBadge`, and `bulkActions.cancel`/`confirm`.

## Testing Strategy (strict TDD, Vitest + happy-dom, `createRoot` + `act`, no RTL)

| Unit | RED tests first |
|------|-----------------|
| PATCH read route | no body sets true; `{isRead:false}`; non-boolean returns 400; bad JSON returns 400; cross-user or audience returns 404; `where` shape |
| GET [id] | 401, 400 missing audience, 404 cross-user or audience, 200 shape, no write calls |
| `useNotificationSelection` (harness component) | anchor math: in-list, removed, end of list, reset on page change; push vs replace calls (spy `history`); popstate resync; close uses `back()` only after a push |
| Row / Pane / EmptyPane | whole-row click fires `onOpen` for href and non-href rows; checkbox does not open; CTA href; toggle label; Prev/Next disabled flags |
| `NotificationDialog` (D9) | renders render-prop content when `open`; not rendered when closed; no split-grid/sticky classes present; close button calls `onClose`; Esc calls `onClose`; gives the dialog an accessible title/description via `aria-labelledby`/`aria-describedby` |
| Client (integration) | open marks read and publishes; unread filter keeps the pane open after the row leaves and Next opens `list[anchor]`; delete advances or clears; failure shows toast and rolls back (mock `sonner`); deep link off-page calls GET; **(D9)** dialog opens on row click, closes via the hook's `close()` on X/Esc, notFound renders inside the dialog, no split grid, Esc on a nested delete-confirm modal closes only the topmost dialog |

Rewrite the existing characterization test "action link click marks read" as "row click marks read". The selection and bulk-delete tests stay.

## Migration / Rollout

No migration. Single PR with `size:exception`. Commit order: API, then hook, then components, then client and pages. Estimated ~950 changed lines, ~45% of them tests (original estimate; the D9 modal rework and the earlier lint-driven hook refactor pushed the actual total well past this — see apply-progress.md for the current figure).

## Open Questions

- [ ] Should delete-advance mark the next item as read? (Design: yes, because opening an item always marks it read.)
