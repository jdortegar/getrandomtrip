"use client";

import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import { resolveClientNotificationHref } from "@/lib/helpers/notificationHrefs";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

interface ClientNotificationsPageClientProps {
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  locale: string;
}

export function ClientNotificationsPageClient(
  props: ClientNotificationsPageClientProps,
) {
  return (
    <RoleNotificationsPageClient
      {...props}
      resolveHref={resolveClientNotificationHref}
    />
  );
}
