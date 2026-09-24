"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, es as esLocale } from "date-fns/locale";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface NotificationListRowProps {
  notification: ClientNotification;
  selected: boolean;
  checked: boolean;
  copy: NotificationsDict;
  locale: string;
  onOpen: (id: string) => void;
  onToggleChecked: (id: string) => void;
}

/** A single row in the notifications list. The whole row opens the reading pane — there is no separate icon-only path. */
export function NotificationListRow({
  notification,
  selected,
  checked,
  copy,
  locale,
  onOpen,
  onToggleChecked,
}: NotificationListRowProps) {
  const { body, createdAt, id, isRead, title } = notification;
  const dateFnsLocale = locale.startsWith("en") ? enUS : esLocale;
  const relativeTime = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: dateFnsLocale,
  });

  return (
    <li>
      <div
        className={cn(
          "flex items-start gap-4 px-5 py-4 transition-colors",
          isRead ? "bg-white" : "bg-sky-50/40",
          selected && "bg-secondary/10",
        )}
        data-component="NotificationListRow"
      >
        <input
          aria-label={copy.table.selectRow}
          checked={checked}
          className="mt-2.5 h-4 w-4 shrink-0 rounded border-gray-300"
          onChange={() => onToggleChecked(id)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          type="checkbox"
        />

        <button
          aria-current={selected}
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
          onClick={() => onOpen(id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen(id);
          }}
          type="button"
        >
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "flex items-center gap-2 text-sm leading-snug",
                isRead ? "font-normal text-neutral-700" : "font-semibold text-ink",
              )}
            >
              {!isRead && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="sr-only">{copy.unreadBadge}</span>
                </span>
              )}
              <span className="truncate">{title}</span>
            </p>
            {body && <p className="mt-0.5 truncate text-sm leading-snug text-ink">{body}</p>}
          </div>

          <span className="ml-auto shrink-0 whitespace-nowrap text-xs text-neutral-400">
            {relativeTime}
          </span>
        </button>
      </div>
    </li>
  );
}
