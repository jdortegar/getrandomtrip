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

/** Response shape for `GET /api/notifications/[id]`. */
export interface NotificationDetailResponse {
  notification: ClientNotification;
}

/** Optional body for `PATCH /api/notifications/[id]/read`. Omitted or `undefined` defaults to `true`. */
export interface NotificationReadPatchBody {
  isRead?: boolean;
}

/** Reading pane lifecycle state — drives which of `NotificationReadingPane`/`NotificationEmptyPane` renders. */
export type NotificationPaneState = "empty" | "loading" | "ready" | "notFound";
