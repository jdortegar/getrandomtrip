"use client";

import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import { useDictionary } from "@/hooks/useDictionary";
import type { NotificationAudience } from "@/components/app/dashboard/config/dashboardNavTypes";
import { NotificationDialog } from "@/components/app/dashboard/shared/notifications/NotificationDialog";
import { NotificationEmptyPane } from "@/components/app/dashboard/shared/notifications/NotificationEmptyPane";
import { NotificationListRow } from "@/components/app/dashboard/shared/notifications/NotificationListRow";
import { NotificationReadingPane } from "@/components/app/dashboard/shared/notifications/NotificationReadingPane";
import { useNotificationSelection } from "@/components/app/dashboard/shared/notifications/useNotificationSelection";
import {
  NOTIFICATIONS_PAGE_SIZE,
  parseNotificationStatus,
  type NotificationAudienceValue,
  type NotificationStatusFilter,
} from "@/lib/notifications/list-query";
import { publishUnreadRefresh } from "@/lib/notifications/unreadDotBus";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

const PAGE_SIZE = NOTIFICATIONS_PAGE_SIZE;

interface RoleNotificationsPageClientProps {
  audience: NotificationAudience;
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  initialPage: number;
  initialSelectedId?: string;
  initialStatus: NotificationStatusFilter;
  initialTotal: number;
  initialUnreadTotal: number;
  locale: string;
  resolveHref: (
    notification: ClientNotification,
    locale: string,
  ) => string | null;
}

export function RoleNotificationsPageClient({
  audience,
  copy,
  initialNotifications,
  initialPage,
  initialSelectedId,
  initialStatus,
  initialTotal,
  initialUnreadTotal,
  locale,
  resolveHref,
}: RoleNotificationsPageClientProps) {
  const filterCopy = useDictionary((d) => d.common.tableFilters);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] =
    useState<ClientNotification[]>(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unreadTotal, setUnreadTotal] = useState(initialUnreadTotal);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<NotificationStatusFilter>(initialStatus);
  const [loading, setLoading] = useState(false); // SSR already seeded page 1
  const [error, setError] = useState<string | null>(null);
  const notificationQuery = JSON.stringify([audience, page, status]);
  const beginRequest = useTableRequestGuard(notificationQuery);
  const [isBusy, setIsBusy] = useState(false); // mark-all-read
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(
    null,
  );
  const selectAllRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(true);
  const pendingDeleteAdvanceRef = useRef<string | null>(null);
  // Bridges the hook's `onResolved` callback (declared before `markRead`
  // exists) to the real `markRead`, defined further below — see the
  // `markReadRef.current = ...` effect near `markRead`'s declaration.
  const markReadRef = useRef<(id: string) => void>(() => {});

  const selection = useNotificationSelection({
    audience: audience as NotificationAudienceValue,
    initialSelectedId,
    list: notifications,
    onResolved: (notification) => {
      // Opening any row (or stepping Prev/Next onto an unread neighbor, or
      // resolving a deep link / popstate) marks it read — there is no
      // icon-only path (spec: "Opening any row marks it read").
      if (!notification.isRead) markReadRef.current(notification.id);
    },
    page,
    status,
  });

  const fetchNotifications = useCallback(async (): Promise<
    ClientNotification[]
  > => {
    const isCurrent = beginRequest();
    if (!isCurrent()) return [];
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status,
        audience,
      });
      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = (await res.json()) as {
        notifications?: ClientNotification[];
        total?: number;
        unreadTotal?: number;
      };
      if (!isCurrent()) return [];
      if (!res.ok || !data.notifications) {
        setError(filterCopy.errorLoad);
        return [];
      }
      setError(null);
      const list = data.notifications;
      setNotifications(list);
      setTotal(data.total ?? 0);
      setUnreadTotal(data.unreadTotal ?? 0);
      // Deleting the last row of the last page must not leave an empty page.
      const nextTotalPages = Math.max(
        1,
        Math.ceil((data.total ?? 0) / PAGE_SIZE),
      );
      if (page > nextTotalPages) setPage(nextTotalPages); // triggers exactly one refetch
      return list;
    } catch {
      if (isCurrent()) setError(filterCopy.errorLoad);
      return [];
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [audience, page, status, beginRequest, filterCopy.errorLoad]);
  const refreshCurrentQuery = useCurrentTableRefresh(fetchNotifications);

  useEffect(() => {
    // The server rendered this exact query; skip the duplicate mount fetch.
    if (hydratedRef.current) {
      hydratedRef.current = false;
      return;
    }
    void fetchNotifications();
  }, [fetchNotifications]);

  function updateStatus(next: NotificationStatusFilter) {
    setStatus(next);
    setSelectedIds(new Set()); // a destructive bulk action must only ever act on visible rows
    setPage(1);
  }

  function handlePageChange(next: number) {
    setPage(next);
    setSelectedIds(new Set());
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allSelected =
    notifications.length > 0 &&
    notifications.every((n) => selectedIds.has(n.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  }

  function toggleRowSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function patchLocalNotification(id: string, isRead: boolean) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead } : n)),
    );
  }

  // A mutation that flips a notification's read state may make it fall out
  // of (or into) the currently filtered list — refetch whenever a filter is
  // active; when unfiltered, a local patch is enough.
  const syncAfterReadStateChange = useCurrentTableRefresh(
    async (previousQuery: string) => {
      if (status !== "all" || previousQuery !== notificationQuery) {
        await refreshCurrentQuery();
      }
    },
  );

  const markRead = useCallback(
    async (id: string) => {
      patchLocalNotification(id, true);
      selection.updateSelected((prev) => ({ ...prev, isRead: true }));
      setUnreadTotal((prev) => Math.max(0, prev - 1));
      try {
        const res = await fetch(
          `/api/notifications/${id}/read?audience=${audience}`,
          { method: "PATCH" },
        );
        if (!res.ok) throw new Error(String(res.status));
        publishUnreadRefresh();
        await syncAfterReadStateChange(notificationQuery);
      } catch {
        patchLocalNotification(id, false);
        selection.updateSelected((prev) => ({ ...prev, isRead: false }));
        setUnreadTotal((prev) => prev + 1);
        toast.error(copy.errors.markReadFailed);
      }
    },
    [
      audience,
      copy.errors.markReadFailed,
      notificationQuery,
      selection,
      syncAfterReadStateChange,
    ],
  );

  const markUnread = useCallback(
    async (id: string) => {
      patchLocalNotification(id, false);
      selection.updateSelected((prev) => ({ ...prev, isRead: false }));
      setUnreadTotal((prev) => prev + 1);
      try {
        const res = await fetch(
          `/api/notifications/${id}/read?audience=${audience}`,
          {
            method: "PATCH",
            body: JSON.stringify({ isRead: false }),
          },
        );
        if (!res.ok) throw new Error(String(res.status));
        publishUnreadRefresh();
        await syncAfterReadStateChange(notificationQuery);
      } catch {
        patchLocalNotification(id, true);
        selection.updateSelected((prev) => ({ ...prev, isRead: true }));
        setUnreadTotal((prev) => Math.max(0, prev - 1));
        toast.error(copy.errors.markUnreadFailed);
      }
    },
    [
      audience,
      copy.errors.markUnreadFailed,
      notificationQuery,
      selection,
      syncAfterReadStateChange,
    ],
  );

  // Bridge the hook's `onResolved` callback (declared above, before
  // `markRead` existed) to the real implementation. `onResolved` only fires
  // when a genuine new resolution happens (list hit, snapshot hit, GET) —
  // never from `updateSelected`'s in-place patches (e.g. an explicit "Mark
  // unread") — so there is no risk of re-triggering on our own optimistic
  // updates or their rollback.
  useEffect(() => {
    markReadRef.current = (id: string) => {
      void markRead(id);
    };
  }, [markRead]);

  async function markAllRead() {
    setIsBusy(true);
    try {
      const res = await fetch(
        `/api/notifications/read-all?audience=${audience}`,
        {
          method: "PATCH",
        },
      );
      if (!res.ok) return;
      publishUnreadRefresh();
      await refreshCurrentQuery();
    } catch {
      // optimistic UI; ignore transient failures
    } finally {
      setIsBusy(false);
    }
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsBulkDeleting(true);
    startTransition(async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/notifications/${id}`, { method: "DELETE" }).then(
              (res) => {
                if (!res.ok) throw new Error(String(res.status));
              },
            ),
          ),
        );
        const failedCount = results.filter(
          (r) => r.status === "rejected",
        ).length;
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
        await refreshCurrentQuery();
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }

  // D2 — delete from the pane refetches, then opens the item now sitting at
  // the frozen anchor; if that slot is empty, the selection clears.
  const handlePaneDelete = useCallback(async () => {
    const id = selection.selectedId;
    if (!id) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      publishUnreadRefresh();
      pendingDeleteAdvanceRef.current = id;
      await refreshCurrentQuery();
    } catch {
      toast.error(copy.errors.deleteFailed);
    }
  }, [copy.errors.deleteFailed, refreshCurrentQuery, selection.selectedId]);

  // Runs once the refetch triggered by handlePaneDelete has landed, using the
  // now up-to-date `notifications`/anchor to resolve the next item. `selection`
  // is a new object every render, so this also re-runs on renders unrelated
  // to a pending delete — harmless, since the ref guard above makes every
  // one of those an immediate no-op.
  useEffect(() => {
    if (!pendingDeleteAdvanceRef.current) return;
    pendingDeleteAdvanceRef.current = null;
    if (selection.canNext) {
      selection.step("next");
    } else {
      selection.clear();
    }
  }, [notifications, selection]);

  const emptyStateBody =
    status === "all" ? copy.emptyState : copy.emptyStateFiltered;

  const selectedNotification = selection.selected;
  const dialogOpen = selection.selectedId !== null;
  const notFoundVariant: "notFound" | "error" = selection.loadError
    ? "error"
    : "notFound";

  const dialogTitle = selectedNotification
    ? selectedNotification.title
    : selection.paneState === "notFound"
      ? notFoundVariant === "error"
        ? copy.pane.loadError
        : copy.pane.notFoundTitle
      : copy.pageTitle;

  const dialogDescription = selectedNotification
    ? (selectedNotification.body ?? selectedNotification.title)
    : selection.paneState === "notFound"
      ? notFoundVariant === "error"
        ? copy.pane.loadError
        : copy.pane.notFoundBody
      : copy.pageTitle;

  return (
    <div data-component="RoleNotificationsPageClient">
      <div className="space-y-6 text-left">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {copy.eyebrow}
            </p>
            <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
              {copy.pageTitle}
            </h2>
          </div>
          {unreadTotal > 0 && (
            <Button
              className="h-auto max-w-full min-h-11 shrink-0 whitespace-normal rounded-sm border-2 border-primary bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800"
              disabled={isBusy}
              onClick={markAllRead}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {copy.markAllRead}
            </Button>
          )}
        </div>

        {unreadTotal > 0 && (
          <StatusIndicatorBadge family="notification" label={copy.unreadCount.replace("{count}", String(unreadTotal))} status="unread" />
        )}

        <TableFilterToolbar
          actions={
            <Button
              className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              type="button"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {copy.bulkActions.deleteSelected.replace(
                "{count}",
                String(selectedIds.size),
              )}
            </Button>
          }
          copy={{ ...filterCopy, count: copy.filters.count }}
          filters={[
            {
              id: `${audience}-notifications-status`,
              label: copy.filters.statusLabel,
              value: status,
              onChange: (value) => updateStatus(parseNotificationStatus(value)),
              options: [
                { value: "all", label: copy.filters.all },
                { value: "unread", label: copy.filters.unread },
                { value: "read", label: copy.filters.read },
              ],
            },
          ]}
          hasActiveFilters={status !== "all"}
          hasError={!!error}
          isLoading={loading}
          onClear={() => updateStatus("all")}
          shown={notifications.length}
          total={total}
        />

        {bulkFailureMessage && (
          <p className="text-xs text-red-600">{bulkFailureMessage}</p>
        )}

        <TableQueryBoundary
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          copy={filterCopy}
          error={error}
          isLoading={loading}
          onRetry={() => {
            if (!loading) void fetchNotifications();
          }}
        >
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <p className="mb-2 text-sm font-semibold text-neutral-700">
                {copy.emptyStateTitle}
              </p>
              <p className="text-sm text-ink">{emptyStateBody}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
                <input
                  aria-label={copy.table.selectAll}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={toggleSelectAll}
                  ref={selectAllRef}
                  type="checkbox"
                />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink">
                  {copy.table.selectAll}
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationListRow
                    checked={selectedIds.has(notification.id)}
                    copy={copy}
                    key={notification.id}
                    locale={locale}
                    notification={notification}
                    onOpen={(id) => selection.open(id, "push")}
                    onToggleChecked={toggleRowSelected}
                    selected={selection.selectedId === notification.id}
                  />
                ))}
              </ul>
            </>
          )}
        </TableQueryBoundary>

        <div inert={loading || !!error || undefined}>
          <Pagination
            nextLabel={paginationCopy.next}
            onPageChange={(next) => {
              if (!loading && !error) handlePageChange(next);
            }}
            page={page}
            pageOfLabel={paginationCopy.pageOf}
            previousLabel={paginationCopy.previous}
            totalPages={totalPages}
          />
        </div>
      </div>

      <NotificationDialog
        closeAriaLabel={copy.pane.closeAriaLabel}
        description={dialogDescription}
        onClose={selection.close}
        open={dialogOpen}
        title={dialogTitle}
      >
        {(titleRef) => {
          if (selectedNotification) {
            return (
              <NotificationReadingPane
                busy={loading}
                canNext={selection.canNext}
                canPrev={selection.canPrev}
                copy={copy}
                href={resolveHref(selectedNotification, locale)}
                locale={locale}
                notification={selectedNotification}
                onDelete={handlePaneDelete}
                onNext={() => selection.step("next")}
                onPrev={() => selection.step("prev")}
                onToggleRead={() => markUnread(selectedNotification.id)}
                titleRef={titleRef}
              />
            );
          }
          if (selection.paneState === "notFound") {
            return (
              <NotificationEmptyPane
                copy={copy}
                titleRef={titleRef}
                variant={notFoundVariant}
              />
            );
          }
          // Transient loading state — only reachable for an off-page deep
          // link or popstate resolution (a list-item open resolves
          // synchronously, so it never visibly passes through this branch).
          return (
            <div
              className="flex min-h-0 flex-1 items-center justify-center p-10"
              data-component="NotificationDialogLoading"
            >
              <h2 className="sr-only" ref={titleRef} tabIndex={-1}>
                {copy.pageTitle}
              </h2>
            </div>
          );
        }}
      </NotificationDialog>

      <ConfirmModal
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={copy.bulkActions.confirm}
        description={copy.bulkActions.confirmBody}
        icon={Trash2}
        isConfirming={isBulkDeleting || isPending}
        onConfirm={handleBulkDelete}
        onOpenChange={setBulkDeleteConfirmOpen}
        open={bulkDeleteConfirmOpen}
        title={copy.bulkActions.confirmTitle.replace(
          "{count}",
          String(selectedIds.size),
        )}
        tone="danger"
      />
    </div>
  );
}
