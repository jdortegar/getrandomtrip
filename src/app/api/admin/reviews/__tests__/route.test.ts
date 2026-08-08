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

describe("GET /api/admin/reviews — sort", () => {
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

  it("defaults to createdAt desc when no sort params are supplied", async () => {
    await GET(makeRequest(""));

    const { orderBy } = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(orderBy[0]).toEqual({ createdAt: "desc" });
  });

  it("sorts by rating ascending when sortBy=rating&sortOrder=asc", async () => {
    await GET(makeRequest("?sortBy=rating&sortOrder=asc"));

    const { orderBy } = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(orderBy[0]).toEqual({ rating: "asc" });
  });

  it("sorts by tripper name via a plain nested orderBy — no nulls key, no tripperId filter anywhere in the query", async () => {
    await GET(makeRequest("?sortBy=tripper&sortOrder=asc"));

    const call = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.orderBy[0]).toEqual({ tripper: { name: "asc" } });
    expect(JSON.stringify(call.orderBy)).not.toContain("nulls");
    expect("tripperId" in call.where).toBe(false);
  });

  it("an unknown sortBy (e.g. isApproved) falls back to the default order, does not throw, does not reach orderBy raw", async () => {
    await GET(makeRequest("?sortBy=isApproved"));

    const { orderBy } = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(orderBy[0]).toEqual({ createdAt: "desc" });
  });

  it("combined: status + search + sort all apply simultaneously — none is dropped", async () => {
    await GET(makeRequest("?status=unapproved&search=Ana&sortBy=rating&sortOrder=asc"));

    const call = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where).toMatchObject({
      isApproved: false,
      user: { name: { contains: "Ana", mode: "insensitive" } },
    });
    expect(call.orderBy[0]).toEqual({ rating: "asc" });

    const countWhere = (prisma.review.count as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where;
    expect(countWhere).toMatchObject({
      isApproved: false,
      user: { name: { contains: "Ana", mode: "insensitive" } },
    });
  });

  it("select/skip/take/count shape and the tripperName mapping remain unchanged when sort params are present", async () => {
    (prisma.review.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "r1",
        content: "Great",
        createdAt: new Date("2026-01-01"),
        destination: null,
        isApproved: true,
        isPublic: true,
        rating: 5,
        title: null,
        tripRequestId: null,
        tripper: null,
        user: { id: "u1", email: "a@b.com", name: "Ana" },
      },
    ]);

    const res = await GET(makeRequest("?sortBy=rating&sortOrder=asc&page=2&limit=10"));
    const body = (await res.json()) as { reviews: Array<{ tripperName: string | null }> };

    const call = (prisma.review.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.select).toBeDefined();
    expect(call.skip).toBe(10);
    expect(call.take).toBe(10);
    expect(body.reviews[0].tripperName).toBeNull();
  });
});
