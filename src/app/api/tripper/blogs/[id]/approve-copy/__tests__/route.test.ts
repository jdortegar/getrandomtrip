import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
    blogPost: { findFirst: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/blog/changed-fields", () => ({
  overwriteOriginalWithCopy: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendBlogCopyApproved: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { overwriteOriginalWithCopy } from "@/lib/blog/changed-fields";
import { sendBlogCopyApproved } from "@/lib/email";

const mockSession = (userId: string) => ({ user: { id: userId, email: "tripper@example.com" } });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });
const mockClientUser = (id: string) => ({ id, roles: ["CLIENT"] });

function makePostRequest(id: string): Request {
  return new Request(`http://localhost/api/tripper/blogs/${id}/approve-copy`, { method: "POST" });
}

describe("POST /api/tripper/blogs/[id]/approve-copy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not a tripper", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("client-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockClientUser("client-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when the blog post is not owned by the caller", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("excludes review copies from the ownership lookup", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    const call = (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.isReviewCopy).toBe(false);
  });

  it("returns 409 unless the blog post is PENDING_TRIPPER_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "blog-1",
      authorId: "tripper-1",
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("overwrites original with copy + deletes copy, on success sends email to admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "blog-1", authorId: "tripper-1", status: "PENDING_TRIPPER_REVIEW" })
      .mockResolvedValueOnce({ id: "copy-1" });

    const mockDelete = vi.fn();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({ blogPost: { delete: mockDelete } }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    expect(overwriteOriginalWithCopy).toHaveBeenCalledWith(expect.anything(), "blog-1", "copy-1");
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "copy-1" } });
    expect(sendBlogCopyApproved).toHaveBeenCalledWith("blog-1", "tripper-1");
  });

  it("returns 404 no_copy when no active review copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "blog-1", authorId: "tripper-1", status: "PENDING_TRIPPER_REVIEW" })
      .mockResolvedValueOnce(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("no_copy");
  });
});
