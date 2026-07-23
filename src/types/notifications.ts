export type NotificationMetadata =
  | { experienceId: string }
  | { blogId: string }
  | { tripRequestId: string }
  | { reviewId: string }
  | null;

export interface ClientNotification {
  id: string;
  userId: string;
  type: string;
  audience: string;
  isRead: boolean;
  title: string;
  body: string | null;
  metadata: NotificationMetadata;
  /** ISO 8601 string — serialized from Date before crossing server→client boundary */
  createdAt: string;
}
