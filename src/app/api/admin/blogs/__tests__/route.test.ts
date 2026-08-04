import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    blogPost: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

describe("GET /api/admin/blogs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.blogPost.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(new NextRequest("http://localhost/api/admin/blogs"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(new NextRequest("http://localhost/api/admin/blogs"));
    expect(res.status).toBe(403);
  });

  it("filters isReviewCopy: false and selects author shape", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(new NextRequest("http://localhost/api/admin/blogs"));
    expect(res.status).toBe(200);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({ isReviewCopy: false });
    expect(findManyArgs.select).toMatchObject({
      id: true,
      title: true,
      status: true,
      author: { select: { id: true, name: true, email: true } },
    });
  });

  it("applies an optional status filter as an 'in' match, supporting comma-separated values for the pending tab", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(
      new NextRequest(
        "http://localhost/api/admin/blogs?status=PENDING_REVIEW,PENDING_TRIPPER_REVIEW",
      ),
    );

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      status: { in: ["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"] },
      isReviewCopy: false,
    });
  });

  it("paginates with page/limit and returns total + a dataset-wide pendingCount", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.count as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(45) // total for the current filter
      .mockResolvedValueOnce(3); // dataset-wide pending count

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      new NextRequest("http://localhost/api/admin/blogs?page=2&limit=10&status=PUBLISHED"),
    );
    const body = await res.json();

    expect(body.total).toBe(45);
    expect(body.pendingCount).toBe(3);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.skip).toBe(10);
    expect(findManyArgs.take).toBe(10);

    // Second count() call must be dataset-wide (pending statuses only,
    // independent of the ?status=PUBLISHED filter applied to the list).
    const secondCountArgs = (prisma.blogPost.count as ReturnType<typeof vi.fn>).mock.calls[1][0];
    expect(secondCountArgs.where).toEqual({
      isReviewCopy: false,
      status: { in: ["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"] },
    });
  });
});
