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
    user: { findUnique: vi.fn() },
    experience: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/admin/experiences${query}`);
}

describe("GET /api/admin/experiences", () => {
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.experience.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const mod = (await import("../route")) as RouteModule;
    GET = mod.GET;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("paginates with page/limit and returns total", async () => {
    (prisma.experience.count as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(53) // total for the current filter
      .mockResolvedValueOnce(4); // dataset-wide pendingCount

    const res = await GET(makeRequest("?page=3&limit=10"));
    const body = await res.json();

    expect(body.total).toBe(53);
    expect(body.pendingCount).toBe(4);
    expect(body.page).toBe(3);
    expect(body.limit).toBe(10);

    const findManyArgs = (prisma.experience.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyArgs.skip).toBe(20);
    expect(findManyArgs.take).toBe(10);
  });

  it("applies a comma-separated status filter as an 'in' match for the pending tab", async () => {
    await GET(
      makeRequest("?status=PENDING_REVIEW,PENDING_TRIPPER_REVIEW"),
    );

    const findManyArgs = (prisma.experience.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      status: { in: ["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"] },
    });
  });

  it("applies a search filter as a case-insensitive title contains match", async () => {
    await GET(makeRequest("?search=patagonia"));

    const findManyArgs = (prisma.experience.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      title: { contains: "patagonia", mode: "insensitive" },
    });
  });

  it("pendingCount query stays dataset-wide, independent of the active status/search filter", async () => {
    await GET(makeRequest("?status=ACTIVE&search=foo"));

    const secondCountArgs = (prisma.experience.count as ReturnType<typeof vi.fn>).mock
      .calls[1][0];
    expect(secondCountArgs.where).toEqual({
      status: { in: ["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"] },
    });
  });

  it("does NOT filter by owner.isActive when ownerActive is absent (admin catalog browsing stays unaffected)", async () => {
    await GET(makeRequest("?status=ACTIVE"));

    const findManyArgs = (prisma.experience.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyArgs.where.owner).toBeUndefined();
  });

  it("filters by owner: { isActive: true } only when ownerActive=true is present (assignment use case)", async () => {
    await GET(makeRequest("?status=ACTIVE&ownerActive=true"));

    const findManyArgs = (prisma.experience.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyArgs.where.owner).toEqual({ isActive: true });
  });
});
