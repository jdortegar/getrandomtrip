"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NotificationsList } from "@/components/app/notifications/NotificationsList";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationsDict } from "@/lib/types/dictionary";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

function getCopy(locale: string): NotificationsDict {
  return locale.startsWith("en") ? enCopy.notifications : esCopy.notifications;
}

interface NotificationsPanelProps {
  copy?: NotificationsDict;
  audience?: "CLIENT" | "TRIPPER";
}

export function NotificationsPanel({ copy: copyProp, audience = "CLIENT" }: NotificationsPanelProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = copyProp ?? getCopy(locale);

  const [notifications, setNotifications] = useState<ClientNotification[]>([]);

  useEffect(() => {
    fetch(`/api/notifications?audience=${audience}`)
      .then((res) => {
        if (!res.ok) throw new Error("non-2xx");
        return res.json() as Promise<{ notifications: ClientNotification[] }>;
      })
      .then(({ notifications }) => setNotifications(notifications))
      .catch(() => setNotifications([]));
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.pageTitle}
      </h3>
      <NotificationsList initialNotifications={notifications} copy={copy} />
    </div>
  );
}
