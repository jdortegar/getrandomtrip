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
    blogPost: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendBlogCopyRejected: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendBlogCopyRejected } from "@/lib/email";

const mockSession = (userId: string) => ({ user: { id: userId, email: "tripper@example.com" } });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });
const mockClientUser = (id: string) => ({ id, roles: ["CLIENT"] });

function makePostRequest(id: string): Request {
  return new Request(`http://localhost/api/tripper/blogs/${id}/reject-copy`, { method: "POST" });
}

describe("POST /api/tripper/blogs/[id]/reject-copy", () => {
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

  it("sets copy isDiscarded:true (tombstone, not deleted) and original -> DRAFT, content unaffected", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "blog-1", authorId: "tripper-1", status: "PENDING_TRIPPER_REVIEW" })
      .mockResolvedValueOnce({ id: "copy-1" });

    const mockCopyUpdate = vi.fn();
    const mockOriginalUpdate = vi.fn();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) => {
        let call = 0;
        return cb({
          blogPost: {
            update: vi.fn().mockImplementation((args: unknown) => {
              call += 1;
              if (call === 1) return mockCopyUpdate(args);
              return mockOriginalUpdate(args);
            }),
          },
        });
      },
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);

    expect(mockCopyUpdate).toHaveBeenCalledWith({
      where: { id: "copy-1" },
      data: { isDiscarded: true },
    });
    expect(mockOriginalUpdate).toHaveBeenCalledWith({
      where: { id: "blog-1" },
      data: { status: "DRAFT" },
    });
    expect(sendBlogCopyRejected).toHaveBeenCalledWith("blog-1", "tripper-1");
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
