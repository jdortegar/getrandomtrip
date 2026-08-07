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
      deleteMany: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "user@example.com" },
});

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/notifications/${id}`, {
    method: "DELETE",
  });
}

describe("DELETE /api/notifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeDeleteRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(res.status).toBe(401);
    expect(prisma.notification.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 200 + { success: true } when the owner deletes their own notification", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeDeleteRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("scopes the delete via a compound where clause containing both id and userId", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    const mod = (await import("../route")) as RouteModule;
    await mod.DELETE(makeDeleteRequest("notif-1"), {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
    });
  });

  it("returns 404, not 403, when the notification belongs to another user (count: 0)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-2"),
    );
    (prisma.notification.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeDeleteRequest("notif-owned-by-user-1"), {
      params: Promise.resolve({ id: "notif-owned-by-user-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Not found" });
  });

  it("returns 404 for a nonexistent id (count: 0), same shape as a cross-user delete", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(makeDeleteRequest("does-not-exist"), {
      params: Promise.resolve({ id: "does-not-exist" }),
    });

    expect(res.status).toBe(404);
  });
});
