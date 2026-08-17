# Design: Notifications Filter, Pagination and Bulk Delete

## Technical Approach

One shared query module (`src/lib/notifications/list-query.ts`) becomes the single definition of "a notifications list query" — status parsing, the Prisma `where`, page size, and row→`ClientNotification` serialization. The three role server pages and `GET /api/notifications` both import it, so the SSR first page and every client-fetched page are provably the same query. On top of that: two additive routes (`DELETE /api/notifications/[id]`, `PATCH /api/notifications/read-all`), one rearchitected client component, and a 12-line module-level pub/sub bus for unread-dot freshness. No schema change.

Decisive finding: once the dead `NotificationsPanel` stack is deleted, **the rearchitected client is the only consumer of `GET /api/notifications`** (verified — `rg 'api/notifications'` returns only `NotificationsPanel.tsx`, `NotificationsList.tsx`, `DashboardUnreadDot.tsx`, and `RoleNotificationsPageClient.tsx`). The GET contract can be redefined freely; no back-compat shim needed.

## Architecture Decisions

| # | Decision | Alternatives rejected | Rationale |
|---|---|---|---|
| D1 | Shared `list-query.ts` owns `where` + serializer, imported by the route **and** the 3 pages | Duplicate the `where` in 4 places (status quo) | 3 pages already duplicate the row→`ClientNotification` map verbatim; a filter that must match between SSR and client fetch cannot survive 4 copies |
| D2 | Keep SSR seed (`initialNotifications` + `initialTotal` + `initialUnreadTotal` + `initialPage` + `initialStatus`), skip the mount fetch with a `hydratedRef` | Pure client-fetch + `LoadingSpinner` like experiences/blog | Notifications render server-side today; a spinner on every visit is a UX regression. `hydratedRef` costs 3 lines and prevents a duplicate request. Deviation from experiences/blog is deliberate and documented |
| D3 | Server pages read `page`/`status` from `searchParams`; the client does **not** push state back to the URL | `router.replace` URL sync | Deep links keep working; experiences/blog have no URL sync at all, so adding it here would be the novel thing. Accepted consequence: URL goes stale after client-side filtering |
| D4 | Keep the `<ul>/<li>` row markup; checkbox becomes the first flex child; select-all moves to a header strip above the list | Convert to `<table>` + `<thead>` for literal parity with experiences/blog | The pattern being matched is the *interaction* (checkbox, tri-state select-all, Delete selected, ConfirmModal, `allSettled`, banner), not the `<table>` element. A message feed is not a record set, and converting would discard the icon puck / unread tint / 2-line body design and triple the diff |
| D5 | `DELETE` uses `deleteMany({ where: { id, userId } })` | `findFirst` then `delete` (what `[id]/read` does); bare `delete({ where: { id } })` | One atomic statement; `count === 0` cleanly means "missing or not yours". A bare `delete` cannot express the ownership filter (`id` is the unique) and throws `P2025` instead of returning a status. `[id]/read`'s 2-query shape is only needed because it returns the updated row |
| D6 | `read-all` mirrors `unread-count`'s param *parsing* but returns **400** on missing/invalid `audience` instead of defaulting to `TRIPPER` | Mirror the `?? "TRIPPER"` fallback exactly | Silently defaulting a **write** is a bug factory: an admin whose param got dropped would mark their TRIPPER rows read and leave the admin dot lit. A default is defensible for a count, not for `updateMany` |
| D7 | Freshness via a module-level pub/sub singleton (`src/lib/notifications/unreadDotBus.ts`) | React Context provider in `StrictDashboardLayout`; `window` CustomEvent; SWR | See below |
| D8 | `GET` also returns `unreadTotal` (a 3rd `count`) | Derive unread from the loaded page | "Mark all read" is global (decision #6). Page-derived unread would hide the button when page 1 happens to be all-read while unread rows sit on page 3 — a visible contradiction of its own semantics |
| D9 | Widen the GET `audience` whitelist to include `ADMIN` | Leave as-is | Current `route.ts:21` only whitelists `TRAVELER`/`TRIPPER`, so `?audience=ADMIN` **silently drops the audience filter** and returns every audience. Latent bug fixed in passing; `unread-count` already whitelists all three |

### D7 rationale — why a bus, not lifted state

`DashboardUnreadDot` is a **sibling** of the page, not an ancestor or descendant: `StrictDashboardLayout` renders `<DashboardRoleShell/>` (→ `DashboardNavTabs` → `DashboardUnreadDot`) and then `{children}` (the page). Lifting state is impossible without turning the shared, `async` server layout into a client boundary that wraps every dashboard page for all three roles — blast radius far beyond notifications. A Context provider inside `StrictDashboardLayout` would work but carries the same "touch the shared layout for all pages" cost. A `window` CustomEvent needs SSR guards and stringly-typed event names. Both components are client components in the same module graph, so a typed module singleton is the smallest correct channel.

```ts
// src/lib/notifications/unreadDotBus.ts
type Listener = () => void;
const listeners = new Set<Listener>();

/** Returns an unsubscribe fn suitable for a useEffect cleanup. */
export function subscribeUnreadRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishUnreadRefresh(): void {
  listeners.forEach((listener) => listener());
}
```

`DashboardUnreadDot`: extract the fetch into a `useCallback refresh`, then
`useEffect(() => { void refresh(); return subscribeUnreadRefresh(() => { void refresh(); }); }, [refresh]);`
No payload — each mounted dot refetches its own `audience`. One channel, published from **all three** mutation paths (`markRead`, `markAllRead`, `handleBulkDelete`).

## Interfaces / Contracts

### `src/lib/notifications/list-query.ts` (new)

```ts
export const NOTIFICATIONS_PAGE_SIZE = 20;
export const NOTIFICATIONS_MAX_LIMIT = 100;
export type NotificationStatusFilter = "all" | "unread" | "read";
export type NotificationAudienceValue = "TRAVELER" | "TRIPPER" | "ADMIN";

export function parseNotificationStatus(v: unknown): NotificationStatusFilter {
  return v === "unread" || v === "read" ? v : "all";
}

export function parseNotificationAudience(v: unknown): NotificationAudienceValue | null {
  return v === "TRAVELER" || v === "TRIPPER" || v === "ADMIN" ? v : null;
}

/** The one true where-clause. `audience: null` = every audience (no filter). */
export function notificationListWhere(args: {
  userId: string;
  audience: NotificationAudienceValue | null;
  status: NotificationStatusFilter;
}) {
  return {
    userId: args.userId,
    ...(args.audience ? { audience: args.audience } : {}),
    ...(args.status === "all" ? {} : { isRead: args.status === "read" }),
  };
}

export function toClientNotification(n: Notification): ClientNotification { /* the map the 3 pages duplicate today */ }
```

`status` maps straight onto the existing `@@index([userId, isRead])`; `all` omits `isRead` entirely and falls back to `@@index([userId, createdAt])` for the sort.

### `GET /api/notifications`

`?page=1&limit=20&status=all|unread|read&audience=TRAVELER|TRIPPER|ADMIN`
Unknown/absent `status` → `all`. Unknown/absent `audience` → no audience filter. `page` clamped `>= 1`, `limit` clamped `1..100`.

```ts
const sp = request.nextUrl.searchParams;
const status = parseNotificationStatus(sp.get("status"));
const audience = parseNotificationAudience(sp.get("audience"));
const page = Math.max(1, Number(sp.get("page")) || 1);
const limit = Math.min(NOTIFICATIONS_MAX_LIMIT, Math.max(1, Number(sp.get("limit")) || NOTIFICATIONS_PAGE_SIZE));
const where = notificationListWhere({ userId: session.user.id, audience, status });

const [rows, total, unreadTotal] = await Promise.all([
  prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  prisma.notification.count({ where }),
  prisma.notification.count({
    where: notificationListWhere({ userId: session.user.id, audience, status: "unread" }),
  }),
]);

return NextResponse.json({
  notifications: rows.map(toClientNotification), total, unreadTotal, page, limit,
});
```

Response: `{ notifications: ClientNotification[]; total: number; unreadTotal: number; page: number; limit: number }` — `{ items, total, page, limit }` shape of `/api/tripper/experiences/route.ts:58`, keeping the existing `notifications` key. 401 when unauthenticated (unchanged).

### `DELETE /api/notifications/[id]/route.ts` (new)

```ts
export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await props.params;

  const { count } = await prisma.notification.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
```

| Case | Status | Body |
|---|---|---|
| No session | 401 | `{ error: "Unauthorized" }` |
| Id missing **or** owned by another user | 404 | `{ error: "Not found" }` |
| Deleted | 200 | `{ success: true }` |

**404, not 403** — a 403 would confirm that someone else's notification id exists. **200, not 204** — every route in this repo answers through `NextResponse.json`, and a 204 must not carry a body; the client only checks `res.ok`, so 200 costs nothing.

### `PATCH /api/notifications/read-all/route.ts` (new)

```ts
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const audience = parseNotificationAudience(request.nextUrl.searchParams.get("audience"));
  if (!audience) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const { count } = await prisma.notification.updateMany({
    where: { audience, isRead: false, userId: session.user.id },
    data: { isRead: true },
  });
  return NextResponse.json({ count });
}
```

401 / 400 / 200 `{ count }`. Scoped by session `userId` + `audience` only — never by `id`, so it reaches rows that were never loaded onto the current page (decision #6).

### Server pages (all three, identical apart from `audience`)

```ts
export default async function AdminNotificationsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ...existing session + hasRoleAccess("admin") + hasLocale/getDictionary block, unchanged...
  const sp = await props.searchParams;
  const status = parseNotificationStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = notificationListWhere({ userId: user.id, audience: "ADMIN", status });

  const [rows, total, unreadTotal] = await Promise.all([
    prisma.notification.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * NOTIFICATIONS_PAGE_SIZE, take: NOTIFICATIONS_PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: notificationListWhere({ userId: user.id, audience: "ADMIN", status: "unread" }),
    }),
  ]);

  return (
    <Section>
      <AdminNotificationsPageClient
        audience="ADMIN"
        copy={dict.notifications}
        initialNotifications={rows.map(toClientNotification)}
        initialPage={page}
        initialStatus={status}
        initialTotal={total}
        initialUnreadTotal={unreadTotal}
        locale={locale}
      />
    </Section>
  );
}
```

`traveler` uses `audience="TRAVELER"` (and keeps its `Section className="py-10!"` + `rt-container` wrapper), `tripper` uses `"TRIPPER"`. The three pass-through clients (`AdminNotificationsPageClient`, `NotificationsPageClient`, `TravelerNotificationsPageClient`) only widen their props interface and keep spreading `{...props}` — `audience` is the sole genuinely new value and it comes from the page, so there is still **zero per-role logic**.

## Client Rearchitecture — `RoleNotificationsPageClient.tsx`

```ts
const SELECT_CLASS = "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";
const PAGE_SIZE = NOTIFICATIONS_PAGE_SIZE;

interface RoleNotificationsPageClientProps {
  audience: NotificationAudience;
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  initialPage: number;
  initialStatus: NotificationStatusFilter;
  initialTotal: number;
  initialUnreadTotal: number;
  locale: string;
  resolveHref: (n: ClientNotification, locale: string) => string | null;
}

const [notifications, setNotifications] = useState(initialNotifications);
const [total, setTotal] = useState(initialTotal);
const [unreadTotal, setUnreadTotal] = useState(initialUnreadTotal);
const [page, setPage] = useState(initialPage);
const [status, setStatus] = useState<NotificationStatusFilter>(initialStatus);
const [loading, setLoading] = useState(false);        // SSR already seeded page 1
const [isBusy, setIsBusy] = useState(false);          // mark-all-read (kept)
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
const [isBulkDeleting, setIsBulkDeleting] = useState(false);
const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(null);
const [isPending, startTransition] = useTransition();
const selectAllRef = useRef<HTMLInputElement>(null);
const hydratedRef = useRef(true);
```

`unreadCount` stops being a `useMemo` over loaded rows and becomes `unreadTotal` (server-truthful). The `useEffect`/`updateFilter`/`handlePageChange` wiring mirrors `ExperiencesPageClient.tsx:87-140` exactly, minus the search debounce (no search box — decision #9):

```ts
const fetchNotifications = useCallback(async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      page: String(page), limit: String(PAGE_SIZE), status, audience,
    });
    const res = await fetch(`/api/notifications?${params.toString()}`);
    const data = (await res.json()) as {
      notifications?: ClientNotification[]; total?: number; unreadTotal?: number;
    };
    setNotifications(data.notifications ?? []);
    setTotal(data.total ?? 0);
    setUnreadTotal(data.unreadTotal ?? 0);
    // Deleting the last row of the last page must not leave an empty page.
    const nextTotalPages = Math.max(1, Math.ceil((data.total ?? 0) / PAGE_SIZE));
    if (page > nextTotalPages) setPage(nextTotalPages); // triggers exactly one refetch
  } finally {
    setLoading(false);
  }
}, [audience, page, status]);

useEffect(() => {
  // The server rendered this exact query; skip the duplicate mount fetch.
  if (hydratedRef.current) { hydratedRef.current = false; return; }
  void fetchNotifications();
}, [fetchNotifications]);

function updateStatus(next: NotificationStatusFilter) {
  setStatus(next);
  setSelectedIds(new Set());   // BlogPageClient.tsx:128-130
  setPage(1);
}
function handlePageChange(next: number) {
  setPage(next);
  setSelectedIds(new Set());
}

const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
const allSelected = notifications.length > 0 && notifications.every((n) => selectedIds.has(n.id));
const someSelected = selectedIds.size > 0 && !allSelected;
useEffect(() => {
  if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
}, [someSelected]);
// toggleSelectAll / toggleRowSelected: verbatim from ExperiencesPageClient.tsx:153-171,
// over `notifications` — NO locked-row filter (decision #3).
```

### Mutations

```ts
async function markRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  if (!res.ok) return;
  publishUnreadRefresh();
  if (status === "unread") {
    await fetchNotifications();          // decision #4: the row leaves the view
  } else {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadTotal((prev) => Math.max(0, prev - 1));
  }
}

async function markAllRead() {
  setIsBusy(true);
  try {
    const res = await fetch(`/api/notifications/read-all?audience=${audience}`, { method: "PATCH" });
    if (!res.ok) return;
    publishUnreadRefresh();
    await fetchNotifications();
  } finally { setIsBusy(false); }
}

function handleBulkDelete() {
  const ids = Array.from(selectedIds);
  setIsBulkDeleting(true);
  startTransition(async () => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/notifications/${id}`, { method: "DELETE" }).then((res) => {
            if (!res.ok) throw new Error(String(res.status));
          }),
        ),
      );
      const failedCount = results.filter((r) => r.status === "rejected").length;
      const successCount = ids.length - failedCount;
      setBulkFailureMessage(
        failedCount > 0
          ? copy.bulkActions.partialFailure
              .replace("{success}", String(successCount))
              .replace("{total}", String(ids.length))
              .replace("{failed}", String(failedCount))
          : null,
      );
      setSelectedIds(new Set());
      setBulkDeleteConfirmOpen(false);
      publishUnreadRefresh();
      await fetchNotifications();
    } finally { setIsBulkDeleting(false); }
  });
}
```

`markAllRead` no longer fans out N PATCHes over `unreadIds` — that loop (`RoleNotificationsPageClient.tsx:73-89`) is deleted outright.

### JSX — what shifts

**1. New filter row** between the section header and the panel, per `design-system.md:170-189` (`justify-between`, controls left, count right). `Delete selected (N)` sits inline in it with the `border-2 border-red-600 bg-red-600 … text-white` danger ink from `ExperiencesPageClient.tsx:338-348`:

```tsx
<div className="flex flex-wrap items-center justify-between gap-3">
  <div className="flex flex-wrap items-center gap-2">
    <Select
      aria-label={copy.filters.statusLabel}
      className={SELECT_CLASS}
      onChange={(e) => updateStatus(parseNotificationStatus(e.target.value))}
      value={status}
    >
      <option value="all">{copy.filters.all}</option>
      <option value="unread">{copy.filters.unread}</option>
      <option value="read">{copy.filters.read}</option>
    </Select>
    <Button
      className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
      disabled={selectedIds.size === 0}
      onClick={() => setBulkDeleteConfirmOpen(true)}
      type="button"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {copy.bulkActions.deleteSelected.replace("{count}", String(selectedIds.size))}
    </Button>
  </div>
  <span className="text-[13px] text-neutral-400">
    {notifications.length} {copy.filters.of} {total} {copy.filters.count}
  </span>
</div>

{bulkFailureMessage && <p className="text-xs text-red-600">{bulkFailureMessage}</p>}
```

**2. Panel gains `overflow-hidden`** — `rounded-xl border border-gray-200 bg-white shadow-sm` → `overflow-hidden rounded-xl …` — and a select-all strip replaces the missing `<thead>`:

```tsx
{notifications.length > 0 && (
  <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
    <input
      aria-label={copy.table.selectAll}
      checked={allSelected}
      className="h-4 w-4 rounded border-gray-300"
      onChange={toggleSelectAll}
      ref={selectAllRef}
      type="checkbox"
    />
    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
      {copy.table.selectAll}
    </span>
  </div>
)}
```

**3. Row checkbox becomes the first flex child**, before the icon puck, inside the existing `flex items-start gap-4` row:

```tsx
<input
  aria-label={copy.table.selectRow}
  checked={selectedIds.has(id)}
  className="mt-2.5 h-4 w-4 shrink-0 rounded border-gray-300"
  onChange={() => toggleRowSelected(id)}
  onClick={(e) => e.stopPropagation()}
  onKeyDown={(e) => e.stopPropagation()}
  type="checkbox"
/>
```

`mt-2.5` (10px) optically centers the 16px box against the 36px `h-9` puck under `items-start`. **`stopPropagation` on both `onClick` and `onKeyDown` is mandatory, not cosmetic**: the row `<div>` carries `onClick={markRead}` and an Enter/Space `onKeyDown` whenever `clickToMarkRead` is true, so without it, ticking a checkbox on an unread href-less row would also mark it read — and under the "Unread" filter the row would vanish mid-selection.

**4. `rounded-t-xl` / `rounded-b-xl` drop off rows** (`RoleNotificationsPageClient.tsx:153-154`) — the header strip now owns the top edge and the panel's new `overflow-hidden` clips both corners. `index` is no longer needed in the `.map()`.

**5. Empty state branches** on whether a filter is active: `status === "all" ? copy.emptyState : copy.emptyStateFiltered`, mirroring `ExperiencesPageClient.tsx:380-383`.

**6. `<Pagination>`** appended after the panel, exact prop set from `ExperiencesPageClient.tsx:574-581`, with `paginationCopy = useDictionary((d) => d.common.pagination)`.

**7. `<ConfirmModal tone="danger" icon={Trash2}>`** for bulk delete, verbatim from `ExperiencesPageClient.tsx:605-619`. No per-row delete button and no single-delete modal — bulk selection is the only delete affordance (nothing in the proposal asks for a row-level trash icon).

### Spec reconciliation (for `sdd-verify`)

Two points where this design refines — not contradicts — `specs/notifications-management/spec.md`:

- *"Requirement: Bulk Delete … MUST offer a checkbox column"* — satisfied by the leading checkbox on every row plus the tri-state select-all in the header strip (D4). "Column" is the visual/interaction concept; the feed is a `<ul>`, so there is no `<td>`.
- *"Scenario: Click a row with no href … clicks anywhere on the row"* — the row's mark-read click target excludes the checkbox itself, which is a control inside the row, not the row. Without that carve-out (D4's `stopPropagation`) selecting a row would silently mutate it.

## Copy — new keys (both locales, mandatory)

Extend the existing `notifications` section in `src/dictionaries/{es,en}.json` and `NotificationsDict` (`src/lib/types/dictionary.ts:1484`) with inline nested objects. Existing flat `emptyState` / `emptyStateTitle` stay as-is (renaming them would churn unrelated call sites), so the filtered empty state is a new sibling key.

| Key | en | es |
|---|---|---|
| `filters.statusLabel` | Filter by status | Filtrar por estado |
| `filters.all` | All | Todas |
| `filters.unread` | Unread | Sin leer |
| `filters.read` | Read | Leídas |
| `filters.of` | of | de |
| `filters.count` | notifications | notificaciones |
| `table.selectAll` | Select all | Seleccionar todo |
| `table.selectRow` | Select notification | Seleccionar notificación |
| `bulkActions.deleteSelected` | Delete selected ({count}) | Eliminar seleccionadas ({count}) |
| `bulkActions.confirmTitle` | Delete {count} notifications? | ¿Eliminar {count} notificaciones? |
| `bulkActions.confirmBody` | This action cannot be undone. | Esta acción no se puede deshacer. |
| `bulkActions.confirm` | Delete | Eliminar |
| `bulkActions.cancel` | Cancel | Cancelar |
| `bulkActions.partialFailure` | Deleted {success} of {total}. {failed} could not be deleted. | Se eliminaron {success} de {total}. No se pudieron eliminar {failed}. |
| `emptyStateFiltered` | No notifications match this filter. | No hay notificaciones que coincidan con este filtro. |

`common.pagination.{previous,next,pageOf}` already exists — reused, not added.

## Data Flow

    searchParams(page,status) ──→ role page.tsx ──┐
                                                  ├─ notificationListWhere() ──→ Prisma
    Select / Pagination ──→ client state ──────────┤        (one shared where)
      └─ GET /api/notifications ───────────────────┘
                                          │
    markRead ─ PATCH [id]/read ────────────┤
    markAllRead ─ PATCH read-all?audience ─┼─→ publishUnreadRefresh()
    bulkDelete ─ DELETE [id] × N (allSettled)          │
                                          │            ▼
                                          │   unreadDotBus listeners
                                          │            │
                                          └──→ refetch page  DashboardUnreadDot.refresh()
                                                            └─ GET unread-count?audience

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/notifications/list-query.ts` | Create | Page size, status/audience parsers, shared `where`, `toClientNotification` |
| `src/lib/notifications/unreadDotBus.ts` | Create | `subscribeUnreadRefresh` / `publishUnreadRefresh` |
| `src/app/api/notifications/route.ts` | Modify | `page`/`limit`/`status`; `ADMIN` whitelisted; `{ notifications, total, unreadTotal, page, limit }` |
| `src/app/api/notifications/[id]/route.ts` | Create | `DELETE`, `deleteMany` ownership scope, 401/404/200 |
| `src/app/api/notifications/read-all/route.ts` | Create | `PATCH`, `updateMany` by `userId` + `audience`, 401/400/200 |
| `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` | Modify | Filter, selection, bulk delete, pagination — bulk of the diff |
| `src/app/[locale]/(secure)/dashboard/{admin,traveler,tripper}/notifications/page.tsx` | Modify | `searchParams`, shared `where`, paginated query, new props |
| `AdminNotificationsPageClient.tsx`, `NotificationsPageClient.tsx`, `TravelerNotificationsPageClient.tsx` | Modify | Props interface widened; `{...props}` spread unchanged |
| `src/components/app/dashboard/shell/DashboardUnreadDot.tsx` | Modify | `useCallback refresh` + bus subscription |
| `src/lib/types/dictionary.ts` | Modify | `NotificationsDict` += `filters`, `table`, `bulkActions`, `emptyStateFiltered` |
| `src/dictionaries/{es,en}.json` | Modify | 15 new keys × 2 locales |
| `src/components/app/notifications/{NotificationsPanel,NotificationsList,NotificationItem}.tsx` | Delete | Dead stack — **re-verified this phase**: `rg 'NotificationsPanel\|NotificationsList\|NotificationItem' src` returns only their own definitions and their mutual imports. Zero external importers |

`prisma/schema.prisma`: **no diff.** `isRead` + `@@index([userId, isRead])` + `@@index([userId, createdAt])` already exist (`schema.prisma:590-606`) and cover every new query. No migration, no `readAt`, no soft-delete flag.

## Testing Strategy

Strict TDD is active — RED before GREEN on every row. Vitest + happy-dom; API tests follow `src/app/api/tripper/experiences/[id]/__tests__/route.test.ts` (mock `next-auth`, `@/lib/auth`, `@/lib/prisma`; build `NextRequest` by hand).

| Layer | What | Where |
|---|---|---|
| Unit | `notificationListWhere`: `unread`→`isRead:false`, `read`→`isRead:true`, `all`→no `isRead`; `audience:null` omits audience; parsers reject junk | `src/lib/notifications/__tests__/list-query.test.ts` |
| Unit | Bus: subscribe→publish invokes, unsubscribe stops, multi-listener fan-out | `src/lib/notifications/__tests__/unreadDotBus.test.ts` |
| Integration | `GET`: 401; `skip/take` from `page`/`limit`; `limit` clamped at 100; `status` → `where`; `?audience=ADMIN` **does** filter (D9 regression); `unreadTotal` ignores `status` | `src/app/api/notifications/__tests__/route.test.ts` |
| Integration | `DELETE`: 401 no session; **404 when the row belongs to another user** (`deleteMany` → `count: 0`); 200 + `{ success: true }`; `where` asserted to contain `userId` | `src/app/api/notifications/[id]/__tests__/route.test.ts` |
| Integration | `read-all`: 401; 400 on missing/invalid audience; `updateMany` where = `{ userId, audience, isRead: false }` with **no id constraint** (proves it reaches rows off page 1) | `src/app/api/notifications/read-all/__tests__/route.test.ts` |
| Component | Selection empties after a status change and after a page change; select-all covers current page only + `indeterminate` on partial; `Delete selected` disabled at 0; partial-failure banner tallies; clicking an unread row under `status="unread"` refetches; checkbox click does **not** trigger `markRead` (D4 `stopPropagation`) | `src/components/app/dashboard/shared/__tests__/RoleNotificationsPageClient.test.tsx` |

## Migration / Rollout

No migration. Both new routes are additive and unreachable until the client ships. Ordering is hard: slice **A** (shared query module + 3 routes + their tests) must precede slice **B** (client rearchitecture + server pages + copy); slice **C** (unread-dot bus + dead-code deletion) is independent of both and can land in either direction. Rollback is a plain revert — except already-deleted rows, which are gone; if delete misbehaves in production, revert the client first (removing the affordance), then investigate the route.

## Open Questions

- [ ] None blocking. Noted for a later cleanup, deliberately out of scope here: `notifications.markRead` and `notifications.unreadBadge` dict keys have no remaining consumers (`rg` finds only the dictionary files and the type), and `@@index([userId, isRead])` does not cover `audience`, so the filtered query filters `audience` in the heap — acceptable at per-user notification volumes and unfixable without the schema change the proposal forbids.
