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

  it("defaults to page 1, limit 20, no status filter", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined, skip: 0, take: 20 }),
    );
  });

  it("computes skip from page and limit", async () => {
    await GET(makeRequest("?page=3&limit=10"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("clamps limit to the max of 100", async () => {
    await GET(makeRequest("?limit=500"));
    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it("applies a valid status filter to the where clause", async () => {
    await GET(makeRequest("?status=CONFIRMED"));
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
      expect.objectContaining({ where: undefined }),
    );
  });

  it("returns dataset-wide statusCounts independent of the status filter", async () => {
    const res = await GET(makeRequest("?status=CONFIRMED"));
    const body = await res.json();
    expect(body.statusCounts).toEqual(
      expect.objectContaining({ CONFIRMED: 2, COMPLETED: 1 }),
    );
  });
});
