"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, es as esLocale } from "date-fns/locale";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CircleCheck,
  CircleX,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface NotificationsPageClientProps {
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  locale: string;
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

function getNotificationHref(
  notification: ClientNotification,
  locale: string,
): string | null {
  const { metadata, type } = notification;
  if (!metadata) return null;

  if ("experienceId" in metadata && metadata.experienceId) {
    const path =
      type === "EXPERIENCE_PENDING_TRIPPER_REVIEW"
        ? `/dashboard/tripper/experiences/${metadata.experienceId}/review-copy`
        : `/dashboard/tripper/experiences/${metadata.experienceId}`;
    return pathForLocale(locale as Locale, path);
  }

  if ("tripRequestId" in metadata && metadata.tripRequestId) {
    return pathForLocale(
      locale as Locale,
      `/dashboard/trips/${metadata.tripRequestId}`,
    );
  }

  return null;
}

export function NotificationsPageClient({
  copy,
  initialNotifications,
  locale,
}: NotificationsPageClientProps) {
  const [notifications, setNotifications] =
    useState<ClientNotification[]>(initialNotifications);
  const [isBusy, setIsBusy] = useState(false);

  const dateFnsLocale = locale.startsWith("en") ? enUS : esLocale;
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  async function markRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // optimistic UI; ignore transient failures
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setIsBusy(true);
    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
        ),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // optimistic UI; ignore transient failures
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
            {copy.pageTitle}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button
            className="h-11 shrink-0 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-gray-800"
            disabled={isBusy}
            onClick={markAllRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {copy.markAllRead}
          </Button>
        )}
      </div>

      {unreadCount > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
          {copy.unreadCount.replace("{count}", String(unreadCount))}
        </span>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
            <p className="mb-2 text-sm font-semibold text-neutral-700">
              {copy.emptyStateTitle}
            </p>
            <p className="text-sm text-neutral-500">{copy.emptyState}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? Bell;
              const isDanger = DANGER_TYPES.has(notification.type);
              const { id, isRead, title, body, createdAt } = notification;
              const href = getNotificationHref(notification, locale);
              const relativeTime = formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: dateFnsLocale,
              });

              const rowClassName = cn(
                "flex items-start gap-4 px-5 py-4 transition-colors",
                isRead ? "bg-white" : "bg-sky-50/40",
                href || !isRead ? "cursor-pointer hover:bg-sky-50/70" : null,
              );

              const rowContent = (
                <>
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      isDanger
                        ? "bg-red-50 text-red-500"
                        : "bg-light-blue/10 text-light-blue",
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
                          : "font-semibold text-neutral-900",
                      )}
                    >
                      {title}
                    </p>
                    {body && (
                      <p className="mt-0.5 text-sm leading-snug text-neutral-500">
                        {body}
                      </p>
                    )}
                  </div>

                  <span className="mt-0.5 shrink-0 whitespace-nowrap text-xs text-neutral-400">
                    {relativeTime}
                  </span>
                </>
              );

              if (href) {
                return (
                  <li key={id}>
                    <Link
                      className={rowClassName}
                      href={href}
                      onClick={() => {
                        if (!isRead) markRead(id);
                      }}
                    >
                      {rowContent}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={id}>
                  <div
                    className={rowClassName}
                    onClick={isRead ? undefined : () => markRead(id)}
                    onKeyDown={
                      isRead
                        ? undefined
                        : (e) => {
                            if (e.key === "Enter" || e.key === " ") markRead(id);
                          }
                    }
                    role={isRead ? undefined : "button"}
                    tabIndex={isRead ? undefined : 0}
                  >
                    {rowContent}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
