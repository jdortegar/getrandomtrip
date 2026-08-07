import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    review: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET } from "../route";

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/admin/reviews${query}`);
}

describe("GET /api/admin/reviews — status + search filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      roles: ["ADMIN"],
    });
    (prisma.review.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.review.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  it("applies no isApproved filter when status is omitted or 'all'", async () => {
    await GET(makeRequest(""));

    const where = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where;
    expect(where?.isApproved).toBeUndefined();
  });

  it("filters isApproved: true for status=approved", async () => {
    await GET(makeRequest("?status=approved"));

    const where = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where;
    expect(where.isApproved).toBe(true);
  });

  it("filters isApproved: false for status=unapproved", async () => {
    await GET(makeRequest("?status=unapproved"));

    const where = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where;
    expect(where.isApproved).toBe(false);
  });

  it("filters by reviewer name (user.name contains, case-insensitive) when search is provided", async () => {
    await GET(makeRequest("?search=Ana"));

    const where = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where;
    expect(where.user).toEqual({
      name: { contains: "Ana", mode: "insensitive" },
    });
  });

  it("applies the same filter to the count query", async () => {
    await GET(makeRequest("?status=unapproved&search=Ana"));

    const countWhere = (prisma.review.count as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where;
    expect(countWhere).toMatchObject({
      isApproved: false,
      user: { name: { contains: "Ana", mode: "insensitive" } },
    });
  });
});
