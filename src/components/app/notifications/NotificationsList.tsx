"use client";

import { useState } from "react";
import { NotificationItem } from "@/components/app/notifications/NotificationItem";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationsDict } from "@/lib/types/dictionary";

interface NotificationsListProps {
  initialNotifications: ClientNotification[];
  copy: NotificationsDict;
}

export function NotificationsList({
  initialNotifications,
  copy,
}: NotificationsListProps) {
  const [notifications, setNotifications] =
    useState<ClientNotification[]>(initialNotifications);

  async function handleMarkRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // fail silently — UI remains optimistic on next interaction
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-neutral-500">{copy.emptyState}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={handleMarkRead}
        />
      ))}
    </div>
  );
}
