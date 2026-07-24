"use client";

import { RoleNotificationsPageClient } from "@/components/app/dashboard/shared/RoleNotificationsPageClient";
import { resolveClientNotificationHref } from "@/lib/helpers/notificationHrefs";
import type { NotificationsDict } from "@/lib/types/dictionary";
import type { ClientNotification } from "@/types/notifications";

interface TravelerNotificationsPageClientProps {
  copy: NotificationsDict;
  initialNotifications: ClientNotification[];
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
