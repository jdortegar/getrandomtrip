"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS, es as esLocale } from "date-fns/locale";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CircleCheck,
  CircleX,
  Eye,
  GitCompare,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TableIconLink } from "@/components/ui/TableIconButton";
import { useDictionary } from "@/hooks/useDictionary";
import type { NotificationAudience } from "@/components/app/dashboard/config/dashboardNavTypes";
import {
  NOTIFICATIONS_PAGE_SIZE,
  parseNotificationStatus,
  type NotificationStatusFilter,
} from "@/lib/notifications/list-query";
import { publishUnreadRefresh } from "@/lib/notifications/unreadDotBus";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";
import { cn } from "@/lib/utils";

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
  resolveHref: (notification: ClientNotification, locale: string) => string | null;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  BOOKING_CANCELLED: CircleX,
  BOOKING_COMPLETED: CalendarCheck,
  BOOKING_CONFIRMED: CircleCheck,
  BOOKING_REVEALED: Sparkles,
  EXPERIENCE_APPROVED: CircleCheck,
  EXPERIENCE_REJECTED: CircleX,
  PAYMENT_RECEIVED: Wallet,
};

const DANGER_TYPES = new Set(["BOOKING_CANCELLED", "EXPERIENCE_REJECTED"]);

export function RoleNotificationsPageClient({
  audience,
  copy,
  initialNotifications,
  initialPage,
  initialStatus,
  initialTotal,
  initialUnreadTotal,
  locale,
  resolveHref,
}: RoleNotificationsPageClientProps) {
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] =
    useState<ClientNotification[]>(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unreadTotal, setUnreadTotal] = useState(initialUnreadTotal);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<NotificationStatusFilter>(initialStatus);
  const [loading, setLoading] = useState(false); // SSR already seeded page 1
  const [isBusy, setIsBusy] = useState(false); // mark-all-read
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(
    null,
  );
  const selectAllRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(true);

  const dateFnsLocale = locale.startsWith("en") ? enUS : esLocale;

  const fetchNotifications = useCallback(async () => {
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
    notifications.length > 0 && notifications.every((n) => selectedIds.has(n.id));
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

  async function markRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok) return;
      publishUnreadRefresh();
      if (status === "unread") {
        await fetchNotifications(); // the row leaves the view once re-filtered
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // optimistic UI; ignore transient failures
    }
  }

  async function markAllRead() {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/notifications/read-all?audience=${audience}`, {
        method: "PATCH",
      });
      if (!res.ok) return;
      publishUnreadRefresh();
      await fetchNotifications();
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
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }

  const emptyStateBody =
    status === "all" ? copy.emptyState : copy.emptyStateFiltered;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-end justify-between gap-4">
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
            className="h-11 shrink-0 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800"
            disabled={isBusy}
            onClick={markAllRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {copy.markAllRead}
          </Button>
        )}
      </div>

      {unreadTotal > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
          {copy.unreadCount.replace("{count}", String(unreadTotal))}
        </span>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label={copy.filters.statusLabel}
            className={SELECT_CLASS}
            onChange={(e) =>
              updateStatus(parseNotificationStatus(e.target.value))
            }
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
            {copy.bulkActions.deleteSelected.replace(
              "{count}",
              String(selectedIds.size),
            )}
          </Button>
        </div>
        <span className="text-[13px] text-neutral-400">
          {notifications.length} {copy.filters.of} {total} {copy.filters.count}
        </span>
      </div>

      {bulkFailureMessage && (
        <p className="text-xs text-red-600">{bulkFailureMessage}</p>
      )}

      <div
        aria-busy={loading}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
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
              {notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type] ?? Bell;
                const isDanger = DANGER_TYPES.has(notification.type);
                const { body, createdAt, id, isRead, title, type } = notification;
                const href = resolveHref(notification, locale);
                const isReviewAction = type === "EXPERIENCE_PENDING_TRIPPER_REVIEW";
                const actionLabel = isReviewAction
                  ? copy.actionReview
                  : copy.actionView;
                const ActionIcon = isReviewAction ? GitCompare : Eye;
                const relativeTime = formatDistanceToNow(new Date(createdAt), {
                  addSuffix: true,
                  locale: dateFnsLocale,
                });

                // Only rows without an explicit action fall back to click-to-mark-read;
                // href-bearing rows navigate solely through the action button below,
                // so the click target is never ambiguous.
                const clickToMarkRead = !href && !isRead;
                const rowClassName = cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors",
                  isRead ? "bg-white" : "bg-sky-50/40",
                  clickToMarkRead ? "cursor-pointer hover:bg-sky-50/70" : null,
                );

                return (
                  <li key={id}>
                    <div
                      className={rowClassName}
                      onClick={clickToMarkRead ? () => markRead(id) : undefined}
                      onKeyDown={
                        clickToMarkRead
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") markRead(id);
                            }
                          : undefined
                      }
                      role={clickToMarkRead ? "button" : undefined}
                      tabIndex={clickToMarkRead ? 0 : undefined}
                    >
                      <input
                        aria-label={copy.table.selectRow}
                        checked={selectedIds.has(id)}
                        className="mt-2.5 h-4 w-4 shrink-0 rounded border-gray-300"
                        onChange={() => toggleRowSelected(id)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        type="checkbox"
                      />

                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                          isDanger
                            ? "bg-red-50 text-red-500"
                            : "bg-secondary/10 text-secondary",
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            isRead
                              ? "font-normal text-neutral-700"
                              : "font-semibold text-ink",
                          )}
                        >
                          {title}
                        </p>
                        {body && (
                          <p className="mt-0.5 text-sm leading-snug text-ink">
                            {body}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="whitespace-nowrap text-xs text-neutral-400">
                          {relativeTime}
                        </span>
                        {href && (
                          <TableIconLink
                            href={href}
                            title={actionLabel}
                            onClick={() => {
                              if (!isRead) markRead(id);
                            }}
                          >
                            <ActionIcon className="h-4 w-4" />
                          </TableIconLink>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <Pagination
        nextLabel={paginationCopy.next}
        onPageChange={handlePageChange}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />

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
