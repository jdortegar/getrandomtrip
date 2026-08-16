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
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  getAccessInviteStatuses: vi.fn().mockResolvedValue(new Map()),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/admin/users${query}`);
}

describe("GET /api/admin/users", () => {
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const mod = (await import("../route")) as RouteModule;
    GET = mod.GET;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin caller", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      roles: ["TRAVELER"],
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("paginates with page/limit and returns total, no filter by default", async () => {
    (prisma.user.count as ReturnType<typeof vi.fn>).mockResolvedValue(64);

    const res = await GET(makeRequest("?page=2&limit=15"));
    const body = await res.json();

    expect(body.total).toBe(64);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(15);

    const findManyArgs = (prisma.user.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.skip).toBe(15);
    expect(findManyArgs.take).toBe(15);
    expect(findManyArgs.where).toBeUndefined();
  });

  it("applies a search filter as a case-insensitive name contains match", async () => {
    await GET(makeRequest("?search=maría"));

    const findManyArgs = (prisma.user.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toEqual({
      name: { contains: "maría", mode: "insensitive" },
    });

    const countArgs = (prisma.user.count as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(countArgs.where).toEqual({
      name: { contains: "maría", mode: "insensitive" },
    });
  });
});
