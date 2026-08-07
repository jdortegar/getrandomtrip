"use client";

import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import { resolveClientNotificationHref } from "@/lib/helpers/notificationHrefs";
import type { NotificationAudience } from "@/components/app/dashboard/config/dashboardNavTypes";
import type { NotificationStatusFilter } from "@/lib/notifications/list-query";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

interface TravelerNotificationsPageClientProps {
  audience: NotificationAudience;
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
  initialPage: number;
  initialStatus: NotificationStatusFilter;
  initialTotal: number;
  initialUnreadTotal: number;
  locale: string;
}

export function TravelerNotificationsPageClient(
  props: TravelerNotificationsPageClientProps,
) {
  return (
    <RoleNotificationsPageClient
      {...props}
      resolveHref={resolveClientNotificationHref}
    />
  );
}
