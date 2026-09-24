import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      updateMany: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "user@example.com" },
});

function makeRequest(id: string, options?: { body?: string; audience?: string }): NextRequest {
  const url = new URL(`http://localhost/api/notifications/${id}/read`);
  if (options?.audience) url.searchParams.set("audience", options.audience);
  return new NextRequest(url, {
    method: "PATCH",
    ...(options?.body !== undefined ? { body: options.body } : {}),
  });
}

describe("PATCH /api/notifications/[id]/read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to isRead:true when no body is sent", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, isRead: true });
  });

  it("marks unread when { isRead: false } is sent", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(
      makeRequest("notif-1", { body: JSON.stringify({ isRead: false }) }),
      { params: Promise.resolve({ id: "notif-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, isRead: false });
  });

  it("returns 400 and does not call updateMany when isRead is a non-boolean value", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(
      makeRequest("notif-1", { body: JSON.stringify({ isRead: "true" }) }),
      { params: Promise.resolve({ id: "notif-1" }) },
    );

    expect(res.status).toBe(400);
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call updateMany when the body is malformed JSON", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("notif-1", { body: "{not-json" }), {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(res.status).toBe(400);
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("returns 200 { success: true, isRead } for the owner", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, isRead: true });
  });

  it("returns 404 for a cross-user id (count: 0)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-2"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("notif-owned-by-user-1"), {
      params: Promise.resolve({ id: "notif-owned-by-user-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Not found" });
  });

  it("returns 404 for a cross-audience id once the route accepts ?audience=", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(
      makeRequest("notif-1", { audience: "ADMIN" }),
      { params: Promise.resolve({ id: "notif-1" }) },
    );

    expect(res.status).toBe(404);
  });

  it("scopes updateMany's where to { id, userId, ...(audience && { audience }) }", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makeRequest("notif-1", { audience: "TRAVELER" }), {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1", audience: "TRAVELER" },
      data: { isRead: true },
    });
  });

  it("scopes updateMany's where without audience when none is sent", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makeRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
      data: { isRead: true },
    });
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(res.status).toBe(401);
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });
});
