"use client";

import { formatDistanceToNow } from "date-fns";
import type { ClientNotification } from "@/types/notifications";

interface NotificationItemProps {
  notification: ClientNotification;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const { id, title, body, isRead, createdAt } = notification;

  const relativeTime = formatDistanceToNow(
    new Date(createdAt as unknown as string | Date),
    { addSuffix: true },
  );

  function handleClick() {
    if (!isRead) onMarkRead(id);
  }

  return (
    <div
      onClick={handleClick}
      role={isRead ? undefined : "button"}
      tabIndex={isRead ? undefined : 0}
      onKeyDown={(e) => { if (!isRead && (e.key === "Enter" || e.key === " ")) handleClick(); }}
      className={`flex items-start gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
        isRead
          ? "bg-white"
          : "bg-blue-50/40 cursor-pointer hover:bg-blue-50/70"
      }`}
    >
      {/* Unread dot */}
      <div className="mt-1.5 shrink-0 w-2 h-2">
        {!isRead && <span className="block w-2 h-2 rounded-full bg-blue-500" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm leading-snug ${isRead ? "font-normal text-neutral-700" : "font-semibold text-neutral-900"}`}>
          {title}
        </p>
        {body && (
          <p className="mt-0.5 text-sm text-neutral-500 leading-snug truncate">{body}</p>
        )}
      </div>

      {/* Timestamp */}
      <span className="shrink-0 text-xs text-neutral-400 mt-0.5 whitespace-nowrap">
        {relativeTime}
      </span>
    </div>
  );
}
