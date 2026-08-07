import type { Notification } from "@prisma/client";
import type { ClientNotification, NotificationMetadata } from "@/types/notifications";

/** Default page size for the notifications list — server pages and the client fetch share it. */
export const NOTIFICATIONS_PAGE_SIZE = 20;
/** Hard ceiling on the client-requested `limit`, mirroring `tripper/experiences`. */
export const NOTIFICATIONS_MAX_LIMIT = 100;

export type NotificationStatusFilter = "all" | "unread" | "read";
export type NotificationAudienceValue = "TRAVELER" | "TRIPPER" | "ADMIN";

/** Unknown/absent input defaults to "all" — never throws on a bad query param. */
export function parseNotificationStatus(value: unknown): NotificationStatusFilter {
  return value === "unread" || value === "read" ? value : "all";
}

/** Unknown/absent input returns null — callers decide whether null means "no filter" or "invalid". */
export function parseNotificationAudience(
  value: unknown,
): NotificationAudienceValue | null {
  return value === "TRAVELER" || value === "TRIPPER" || value === "ADMIN"
    ? value
    : null;
}

/**
 * The one true `where` clause for a notifications list query.
 * `audience: null` means every audience (no filter) — used only by read paths
 * that intentionally span audiences; write paths (e.g. read-all) must reject
 * a null audience before calling this.
 */
export function notificationListWhere(args: {
  userId: string;
  audience: NotificationAudienceValue | null;
  status: NotificationStatusFilter;
}) {
  return {
    userId: args.userId,
    ...(args.audience ? { audience: args.audience } : {}),
    ...(args.status === "all" ? {} : { isRead: args.status === "read" }),
  };
}

/** The row -> ClientNotification map every consumer used to duplicate inline. */
export function toClientNotification(n: Notification): ClientNotification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    audience: n.audience,
    isRead: n.isRead,
    title: n.title,
    body: n.body,
    metadata: n.metadata as NotificationMetadata,
    createdAt: n.createdAt.toISOString(),
  };
}
