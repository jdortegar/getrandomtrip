import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { ClientNotification } from "@/types/notifications";

export function resolveClientNotificationHref(
  notification: ClientNotification,
  locale: string,
): string | null {
  const { metadata } = notification;
  if (!metadata) return null;

  if ("tripRequestId" in metadata && metadata.tripRequestId) {
    return pathForLocale(
      locale as Locale,
      `/dashboard/trips/${metadata.tripRequestId}`,
    );
  }

  return null;
}

export function resolveAdminNotificationHref(
  notification: ClientNotification,
  locale: string,
): string | null {
  const { metadata } = notification;
  if (!metadata) return null;

  if ("reviewId" in metadata && metadata.reviewId) {
    return pathForLocale(locale as Locale, "/dashboard/admin/reviews");
  }

  if ("tripRequestId" in metadata && metadata.tripRequestId) {
    return pathForLocale(locale as Locale, "/dashboard/admin/trip-requests");
  }

  if ("experienceId" in metadata && metadata.experienceId) {
    return pathForLocale(locale as Locale, "/dashboard/admin/experiences");
  }

  return null;
}

export function resolveTripperNotificationHref(
  notification: ClientNotification,
  locale: string,
): string | null {
  const { metadata, type } = notification;
  if (!metadata) return null;

  if ("experienceId" in metadata && metadata.experienceId) {
    const path =
      type === "EXPERIENCE_PENDING_TRIPPER_REVIEW"
        ? `/dashboard/tripper/experiences/${metadata.experienceId}/review-copy`
        : `/dashboard/tripper/experiences/${metadata.experienceId}`;
    return pathForLocale(locale as Locale, path);
  }

  if ("blogId" in metadata && metadata.blogId) {
    const path =
      type === "BLOG_PENDING_TRIPPER_REVIEW"
        ? `/dashboard/tripper/blog/${metadata.blogId}/review-copy`
        : `/dashboard/tripper/blog/${metadata.blogId}`;
    return pathForLocale(locale as Locale, path);
  }

  if ("tripRequestId" in metadata && metadata.tripRequestId) {
    return pathForLocale(
      locale as Locale,
      `/dashboard/trips/${metadata.tripRequestId}`,
    );
  }

  return null;
}
