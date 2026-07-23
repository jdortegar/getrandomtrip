import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
    blogPost: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendBlogSubmitted: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendBlogSubmitted } from "@/lib/email";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "tripper@example.com" },
});

const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });
const mockClientUser = (id: string) => ({ id, roles: ["CLIENT"] });

const completeDraftBlog = (authorId: string, overrides: Record<string, unknown> = {}) => ({
  id: "blog-1",
  authorId,
  status: "DRAFT",
  title: "Mi aventura",
  coverUrl: "https://example.com/cover.jpg",
  content: "<p>Contenido</p>",
  reviewNote: null,
  ...overrides,
});

const incompleteDraftBlog = (authorId: string) => ({
  id: "blog-2",
  authorId,
  status: "DRAFT",
  title: "Mi aventura",
  coverUrl: "", // missing
  content: "<p>Contenido</p>",
  reviewNote: null,
});

function makePostRequest(id: string): Request {
  return new Request(`http://localhost/api/tripper/blogs/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

describe("POST /api/tripper/blogs/[id]/submit", () => {
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

  it("returns 403 when the caller is not a tripper (CLIENT role)", async () => {
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

  it("excludes review copies from the ownership lookup — a tripper can never submit an admin's working copy", async () => {
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

  it("returns 409 when blog post is not in DRAFT status", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...completeDraftBlog("tripper-1"),
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 422 with missing[] when required fields are incomplete", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      incompleteDraftBlog("tripper-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-2"), {
      params: Promise.resolve({ id: "blog-2" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("incomplete");
    expect(body.missing).toContain("coverUrl");
  });

  it("returns 200 and sets status to PENDING_REVIEW on valid DRAFT", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      completeDraftBlog("tripper-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({
          blogPost: {
            findFirst: vi.fn().mockResolvedValue(null), // no tombstone copy
            update: vi.fn().mockResolvedValue({ id: "blog-1", status: "PENDING_REVIEW" }),
            delete: vi.fn(),
          },
        }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blog.status).toBe("PENDING_REVIEW");
    expect(sendBlogSubmitted).toHaveBeenCalledWith("blog-1", "tripper-1");
  });

  it("deletes a discarded tombstone copy when resubmitting after a tripper rejection", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      completeDraftBlog("tripper-1"),
    );
    const mockDelete = vi.fn().mockResolvedValue({ id: "tombstone-1" });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({
          blogPost: {
            findFirst: vi.fn().mockResolvedValue({ id: "tombstone-1" }),
            update: vi.fn().mockResolvedValue({ id: "blog-1", status: "PENDING_REVIEW" }),
            delete: mockDelete,
          },
        }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "tombstone-1" } });
  });
});
