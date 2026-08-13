import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";
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
    user: { findUnique: vi.fn() },
    tripRequest: { findMany: vi.fn(), count: vi.fn() },
    experience: { findUnique: vi.fn() },
    payment: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/admin/trip-requests", () => ({
  attachAdminTripRequestRelations: vi.fn((trips: unknown[]) => trips),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockSession = (userId: string) => ({
  user: { id: userId, email: "admin@example.com" },
});

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/admin/trip-requests${query}`);
}

describe("GET /api/admin/trip-requests", () => {
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: "trip-1", userId: "user-1", experienceId: null, status: "CONFIRMED" }])
      .mockResolvedValueOnce([
        { status: "CONFIRMED" },
        { status: "CONFIRMED" },
        { status: "COMPLETED" },
      ]);
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const mod = (await import("../route")) as RouteModule;
    GET = mod.GET;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  // These three are about generic page/limit mechanics, not about sort
  // behavior — `sortBy=type` routes them through the plain DB-level
  // skip/take path (the default `sortBy=tripDate` path paginates in
  // memory instead; see the "default tripDate sort" describe block below).

  it("defaults to page 1, limit 20, no status filter", async () => {
    const res = await GET(makeRequest("?sortBy=type"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 0, take: 20 }),
    );
  });

  it("computes skip from page and limit", async () => {
    await GET(makeRequest("?page=3&limit=10&sortBy=type"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("clamps limit to the max of 100", async () => {
    await GET(makeRequest("?limit=500&sortBy=type"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it("applies a valid status filter to the where clause", async () => {
    await GET(makeRequest("?status=CONFIRMED&sortBy=type"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "CONFIRMED" } }),
    );
    expect(prisma.tripRequest.count).toHaveBeenCalledWith({
      where: { status: "CONFIRMED" },
    });
  });

  it("ignores an invalid status value", async () => {
    await GET(makeRequest("?status=NOT_A_REAL_STATUS"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("returns dataset-wide statusCounts independent of the status filter", async () => {
    const res = await GET(makeRequest("?status=CONFIRMED"));
    const body = await res.json();
    expect(body.statusCounts).toEqual(
      expect.objectContaining({ CONFIRMED: 2, COMPLETED: 1 }),
    );
  });

  it("applies a valid type filter to the where clause", async () => {
    await GET(makeRequest("?type=xsed"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: "xsed" } }),
    );
  });

  it("ignores an invalid type value", async () => {
    await GET(makeRequest("?type=not-a-type"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("applies a valid level filter to the where clause", async () => {
    await GET(makeRequest("?level=xsed"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { level: "xsed" } }),
    );
  });

  it("applies a payment status filter via the payment relation", async () => {
    await GET(makeRequest("?paymentStatus=APPROVED"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { payment: { status: "APPROVED" } },
      }),
    );
  });

  it("applies the NO_PAYMENT sentinel as a null relation filter", async () => {
    await GET(makeRequest("?paymentStatus=NO_PAYMENT"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { payment: null } }),
    );
  });

  it("applies a search term as a traveler name/email filter", async () => {
    await GET(makeRequest("?search=ana"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user: {
            OR: [
              { name: { contains: "ana", mode: "insensitive" } },
              { email: { contains: "ana", mode: "insensitive" } },
            ],
          },
        },
      }),
    );
  });

  it("composes status, type, level, payment, and search filters together", async () => {
    await GET(
      makeRequest(
        "?status=CONFIRMED&type=family&level=bivouac&paymentStatus=PENDING&search=ana",
      ),
    );
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "CONFIRMED",
          type: "family",
          level: "bivouac",
          payment: { status: "PENDING" },
          user: {
            OR: [
              { name: { contains: "ana", mode: "insensitive" } },
              { email: { contains: "ana", mode: "insensitive" } },
            ],
          },
        },
      }),
    );
  });
});

describe("GET /api/admin/trip-requests — default tripDate sort", () => {
  let GET: RouteModule["GET"];

  const soon = { id: "soon", userId: "u1", experienceId: null, status: "CONFIRMED", startDate: "2026-08-15T00:00:00.000Z" };
  const further = { id: "further", userId: "u2", experienceId: null, status: "CONFIRMED", startDate: "2026-09-01T00:00:00.000Z" };
  const recentPast = { id: "recent-past", userId: "u3", experienceId: null, status: "COMPLETED", startDate: "2026-08-10T00:00:00.000Z" };
  const oldPast = { id: "old-past", userId: "u4", experienceId: null, status: "COMPLETED", startDate: "2026-01-01T00:00:00.000Z" };

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T00:00:00.000Z"));
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    // Deliberately unsorted, mirroring an arbitrary DB row order.
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([oldPast, further, recentPast, soon])
      .mockResolvedValueOnce([
        { status: "CONFIRMED" },
        { status: "CONFIRMED" },
        { status: "COMPLETED" },
        { status: "COMPLETED" },
      ]);
    const mod = (await import("../route")) as RouteModule;
    GET = mod.GET;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to tripDate sort with no sortBy param, soonest upcoming first", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.tripRequests.map((t: { id: string }) => t.id)).toEqual([
      "soon",
      "further",
      "recent-past",
      "old-past",
    ]);
  });

  it("does not call prisma.tripRequest.count for the tripDate path (paginates in memory)", async () => {
    await GET(makeRequest());
    expect(prisma.tripRequest.count).not.toHaveBeenCalled();
  });

  it("reports the full matching count as total, independent of page size", async () => {
    const res = await GET(makeRequest("?limit=2"));
    const body = await res.json();
    expect(body.total).toBe(4);
    expect(body.tripRequests).toHaveLength(2);
  });

  it("slices the proximity-sorted list per page", async () => {
    const res = await GET(makeRequest("?limit=2&page=2"));
    const body = await res.json();
    expect(body.tripRequests.map((t: { id: string }) => t.id)).toEqual([
      "recent-past",
      "old-past",
    ]);
  });

  it("reverses to furthest-past-first when sortOrder=desc", async () => {
    const res = await GET(makeRequest("?sortOrder=desc"));
    const body = await res.json();
    expect(body.tripRequests.map((t: { id: string }) => t.id)).toEqual([
      "old-past",
      "recent-past",
      "further",
      "soon",
    ]);
  });
});
