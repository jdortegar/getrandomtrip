import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type RouteModule = typeof import("../route");

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "user@example.com" },
});

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/notifications${query}`);
}

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest());

    expect(res.status).toBe(401);
  });

  it("defaults to page 1, limit 20 and passes skip/take to Prisma", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest());
    const body = await res.json();

    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it("computes skip/take from explicit page and limit", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(makeRequest("?page=3&limit=10"));

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("clamps limit at NOTIFICATIONS_MAX_LIMIT (100) even if a larger value is requested", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest("?limit=500"));
    const body = await res.json();

    expect(body.limit).toBe(100);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it("narrows the where clause to isRead: false when status=unread", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(makeRequest("?status=unread"));

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", isRead: false }),
      }),
    );
  });

  it("narrows the where clause to isRead: true when status=read", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(makeRequest("?status=read"));

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", isRead: true }),
      }),
    );
  });

  it("computes unreadTotal independently of the requested status filter", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );
    (prisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(5); // total
    (prisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(3); // unreadTotal

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(makeRequest("?status=read"));
    const body = await res.json();

    expect(body.unreadTotal).toBe(3);
    // The unreadTotal count call must filter isRead:false regardless of the
    // requested status=read filter used for the main query.
    const unreadCountCall = (
      prisma.notification.count as ReturnType<typeof vi.fn>
    ).mock.calls[1]![0];
    expect(unreadCountCall.where).toEqual(
      expect.objectContaining({ isRead: false }),
    );
  });

  it("D9 regression: ?audience=ADMIN actually filters to ADMIN rows only", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(makeRequest("?audience=ADMIN"));

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ audience: "ADMIN" }),
      }),
    );
  });

  it("still filters TRAVELER and TRIPPER audiences (no regression on the existing whitelist)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(makeRequest("?audience=TRIPPER"));

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ audience: "TRIPPER" }),
      }),
    );
  });

  it("omits the audience filter entirely for an invalid/absent audience", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("user-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(makeRequest("?audience=BOGUS"));

    const call = (prisma.notification.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(call.where).not.toHaveProperty("audience");
  });
});
