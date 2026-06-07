import type { Notification } from "@prisma/client";

export type NotificationMetadata =
  | { experienceId: string }
  | { tripRequestId: string }
  | null;

export type ClientNotification = Omit<Notification, "metadata"> & {
  metadata: NotificationMetadata;
};
