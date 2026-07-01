"use client";

import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import { resolveTripperNotificationHref } from "@/lib/helpers/notificationHrefs";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

interface NotificationsPageClientProps {
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  locale: string;
}

export function NotificationsPageClient(props: NotificationsPageClientProps) {
  return (
    <RoleNotificationsPageClient
      {...props}
      resolveHref={resolveTripperNotificationHref}
    />
  );
}
