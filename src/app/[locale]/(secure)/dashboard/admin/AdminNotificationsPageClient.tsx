"use client";

import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import { resolveAdminNotificationHref } from "@/lib/helpers/notificationHrefs";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

interface AdminNotificationsPageClientProps {
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  locale: string;
}

export function AdminNotificationsPageClient(
  props: AdminNotificationsPageClientProps,
) {
  return (
    <RoleNotificationsPageClient
      {...props}
      resolveHref={resolveAdminNotificationHref}
    />
  );
}
