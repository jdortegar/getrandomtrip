import { describe, expect, it } from "vitest";
import {
  resolveAdminNotificationHref,
  resolveTripperNotificationHref,
} from "../notificationHrefs";
import type { ClientNotification } from "@/types/notifications";

function makeNotification(
  overrides: Partial<ClientNotification> = {},
): ClientNotification {
  return {
    id: "n1",
    userId: "u1",
    type: "REVIEW_SUBMITTED",
    audience: "ADMIN",
    isRead: false,
    title: "Test",
    body: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("resolveAdminNotificationHref", () => {
  it("links a review-submitted notification to the admin reviews list", () => {
    const notification = makeNotification({ metadata: { reviewId: "r1" } });
    expect(resolveAdminNotificationHref(notification, "es")).toBe(
      "/dashboard/admin/reviews",
    );
  });

  it("links a destination-assignment reminder to the admin trip-requests list", () => {
    const notification = makeNotification({
      type: "BOOKING_CONFIRMED",
      metadata: { tripRequestId: "t1" },
    });
    expect(resolveAdminNotificationHref(notification, "es")).toBe(
      "/dashboard/admin/trip-requests",
    );
  });

  it("links an experience-related notification to the admin experiences list", () => {
    const notification = makeNotification({ metadata: { experienceId: "e1" } });
    expect(resolveAdminNotificationHref(notification, "es")).toBe(
      "/dashboard/admin/experiences",
    );
  });

  it("prefixes the href with the locale for non-default locales", () => {
    const notification = makeNotification({ metadata: { reviewId: "r1" } });
    expect(resolveAdminNotificationHref(notification, "en")).toBe(
      "/en/dashboard/admin/reviews",
    );
  });

  it("returns null when there is no metadata", () => {
    const notification = makeNotification({ metadata: null });
    expect(resolveAdminNotificationHref(notification, "es")).toBeNull();
  });
});

describe("resolveTripperNotificationHref", () => {
  it("links a BLOG_PENDING_TRIPPER_REVIEW notification to the review-copy page", () => {
    const notification = makeNotification({
      type: "BLOG_PENDING_TRIPPER_REVIEW",
      metadata: { blogId: "b1" },
    });
    expect(resolveTripperNotificationHref(notification, "es")).toBe(
      "/dashboard/tripper/blog/b1/review-copy",
    );
  });

  it("links a BLOG_APPROVED/BLOG_REJECTED notification to the plain edit page, not review-copy", () => {
    const approved = makeNotification({
      type: "BLOG_APPROVED",
      metadata: { blogId: "b1" },
    });
    expect(resolveTripperNotificationHref(approved, "es")).toBe(
      "/dashboard/tripper/blog/b1",
    );

    const rejected = makeNotification({
      type: "BLOG_REJECTED",
      metadata: { blogId: "b1" },
    });
    expect(resolveTripperNotificationHref(rejected, "es")).toBe(
      "/dashboard/tripper/blog/b1",
    );
  });

  it("links an EXPERIENCE_PENDING_TRIPPER_REVIEW notification to the experience review-copy page", () => {
    const notification = makeNotification({
      type: "EXPERIENCE_PENDING_TRIPPER_REVIEW",
      metadata: { experienceId: "e1" },
    });
    expect(resolveTripperNotificationHref(notification, "es")).toBe(
      "/dashboard/tripper/experiences/e1/review-copy",
    );
  });

  it("prefixes the href with the locale for non-default locales", () => {
    const notification = makeNotification({
      type: "BLOG_PENDING_TRIPPER_REVIEW",
      metadata: { blogId: "b1" },
    });
    expect(resolveTripperNotificationHref(notification, "en")).toBe(
      "/en/dashboard/tripper/blog/b1/review-copy",
    );
  });

  it("returns null when there is no metadata", () => {
    const notification = makeNotification({ metadata: null });
    expect(resolveTripperNotificationHref(notification, "es")).toBeNull();
  });
});
