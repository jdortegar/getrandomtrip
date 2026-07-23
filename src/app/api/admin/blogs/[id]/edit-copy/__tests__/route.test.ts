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
    blogPost: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePatchRequest(id: string, body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest(`http://localhost/api/admin/blogs/${id}/edit-copy`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/blogs/[id]/edit-copy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1"), {
      params: Promise.resolve({ id: "copy-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1", { title: "Updated" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 forbidden unless the target isReviewCopy === true", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      isReviewCopy: false,
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("blog-1", { title: "Updated" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("writes allowed body fields to the copy and keeps slug null", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "DRAFT",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ id: "copy-1", ...data }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(
      makePatchRequest("copy-1", { title: "New Title", coverUrl: "https://example.com/x.jpg" }),
      { params: Promise.resolve({ id: "copy-1" }) },
    );
    expect(res.status).toBe(200);
    const updateArgs = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "copy-1" });
    expect(updateArgs.data.title).toBe("New Title");
    expect(updateArgs.data.coverUrl).toBe("https://example.com/x.jpg");
    expect(updateArgs.data).not.toHaveProperty("slug");
  });

  it("returns 404 when the blog post does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1", { title: "x" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });
    expect(res.status).toBe(404);
  });
});
