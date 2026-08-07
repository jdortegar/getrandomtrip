import { describe, it, expect } from "vitest";
import {
  notificationListWhere,
  parseNotificationAudience,
  parseNotificationStatus,
  toClientNotification,
  NOTIFICATIONS_PAGE_SIZE,
  NOTIFICATIONS_MAX_LIMIT,
} from "../list-query";

describe("parseNotificationStatus", () => {
  it("returns 'unread' for the literal 'unread'", () => {
    expect(parseNotificationStatus("unread")).toBe("unread");
  });

  it("returns 'read' for the literal 'read'", () => {
    expect(parseNotificationStatus("read")).toBe("read");
  });

  it("defaults junk/absent input to 'all'", () => {
    expect(parseNotificationStatus(null)).toBe("all");
    expect(parseNotificationStatus(undefined)).toBe("all");
    expect(parseNotificationStatus("bogus")).toBe("all");
    expect(parseNotificationStatus("")).toBe("all");
  });
});

describe("parseNotificationAudience", () => {
  it("accepts TRAVELER, TRIPPER, and ADMIN", () => {
    expect(parseNotificationAudience("TRAVELER")).toBe("TRAVELER");
    expect(parseNotificationAudience("TRIPPER")).toBe("TRIPPER");
    expect(parseNotificationAudience("ADMIN")).toBe("ADMIN");
  });

  it("rejects junk/absent input as null", () => {
    expect(parseNotificationAudience(null)).toBeNull();
    expect(parseNotificationAudience(undefined)).toBeNull();
    expect(parseNotificationAudience("traveler")).toBeNull();
    expect(parseNotificationAudience("SUPERADMIN")).toBeNull();
  });
});

describe("notificationListWhere", () => {
  it("maps status 'unread' to isRead: false", () => {
    const where = notificationListWhere({
      userId: "user-1",
      audience: null,
      status: "unread",
    });
    expect(where).toEqual({ userId: "user-1", isRead: false });
  });

  it("maps status 'read' to isRead: true", () => {
    const where = notificationListWhere({
      userId: "user-1",
      audience: null,
      status: "read",
    });
    expect(where).toEqual({ userId: "user-1", isRead: true });
  });

  it("omits the isRead key entirely for status 'all'", () => {
    const where = notificationListWhere({
      userId: "user-1",
      audience: null,
      status: "all",
    });
    expect(where).toEqual({ userId: "user-1" });
    expect(where).not.toHaveProperty("isRead");
  });

  it("omits the audience key when audience is null", () => {
    const where = notificationListWhere({
      userId: "user-1",
      audience: null,
      status: "all",
    });
    expect(where).not.toHaveProperty("audience");
  });

  it("includes the audience key when audience is provided", () => {
    const where = notificationListWhere({
      userId: "user-1",
      audience: "ADMIN",
      status: "all",
    });
    expect(where).toEqual({ userId: "user-1", audience: "ADMIN" });
  });

  it("combines audience and status filters together", () => {
    const where = notificationListWhere({
      userId: "user-2",
      audience: "TRIPPER",
      status: "unread",
    });
    expect(where).toEqual({
      userId: "user-2",
      audience: "TRIPPER",
      isRead: false,
    });
  });
});

describe("toClientNotification", () => {
  it("serializes a Prisma Notification row into a ClientNotification", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");
    const result = toClientNotification({
      id: "notif-1",
      userId: "user-1",
      type: "BOOKING_CONFIRMED",
      audience: "TRAVELER",
      isRead: false,
      title: "Your trip is confirmed",
      body: "See you soon!",
      metadata: { tripRequestId: "trip-1" },
      createdAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(result).toEqual({
      id: "notif-1",
      userId: "user-1",
      type: "BOOKING_CONFIRMED",
      audience: "TRAVELER",
      isRead: false,
      title: "Your trip is confirmed",
      body: "See you soon!",
      metadata: { tripRequestId: "trip-1" },
      createdAt: "2026-01-15T10:00:00.000Z",
    });
  });

  it("passes through a null body and null metadata unchanged", () => {
    const createdAt = new Date("2026-02-01T00:00:00.000Z");
    const result = toClientNotification({
      id: "notif-2",
      userId: "user-2",
      type: "PAYMENT_RECEIVED",
      audience: "TRIPPER",
      isRead: true,
      title: "Payment received",
      body: null,
      metadata: null,
      createdAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(result.body).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.createdAt).toBe("2026-02-01T00:00:00.000Z");
  });
});

describe("constants", () => {
  it("exposes the page size and max limit used by the API and pages", () => {
    expect(NOTIFICATIONS_PAGE_SIZE).toBe(20);
    expect(NOTIFICATIONS_MAX_LIMIT).toBe(100);
  });
});
