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

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/notifications/read-all${query}`, {
    method: "PATCH",
  });
}

describe("PATCH /api/notifications/read-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("?audience=TRIPPER"));

    expect(res.status).toBe(401);
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 when audience is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid audience" });
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 when audience is invalid — does NOT silently default to TRIPPER (D6)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("?audience=BOGUS"));

    expect(res.status).toBe(400);
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("scopes the update to { userId, audience, isRead: false } with no id constraint", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 7,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("?audience=TRIPPER"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ count: 7 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", audience: "TRIPPER", isRead: false },
      data: { isRead: true },
    });
    const call = (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(call.where).not.toHaveProperty("id");
  });

  it("reaches rows beyond page 1 — the where has no page/skip/take concept at all", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-2"),
    );
    (prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 42,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makeRequest("?audience=ADMIN"));
    const body = await res.json();

    // 42 unread rows updated even though only ~20 could ever have been
    // loaded onto a single page — proves this is a global scoped update.
    expect(body.count).toBe(42);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-2", audience: "ADMIN", isRead: false },
      data: { isRead: true },
    });
  });
});
