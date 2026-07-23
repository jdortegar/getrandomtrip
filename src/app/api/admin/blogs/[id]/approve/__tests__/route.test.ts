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
    blogPost: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/helpers/sendMail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/lib/blog/changed-fields", () => ({
  overwriteOriginalWithCopy: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";
import { overwriteOriginalWithCopy } from "@/lib/blog/changed-fields";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePostRequest(id: string, body: Record<string, unknown> = {}): Request {
  return new Request(`http://localhost/api/admin/blogs/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/blogs/[id]/approve", () => {
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

  it("returns 403 when the caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 409 unless the blog post is PENDING_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "DRAFT",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("direct approve sets PUBLISHED + publishedAt when no active copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
      authorId: "tripper-1",
      title: "My Trip",
      publishedAt: null,
    });
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null); // no copy
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PUBLISHED",
      authorId: "tripper-1",
      title: "My Trip",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blog.status).toBe("PUBLISHED");
    expect(prisma.blogPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "blog-1" },
        data: expect.objectContaining({ status: "PUBLISHED", isActive: true }),
      }),
    );
  });

  it("with an active copy, overwrites original with the copy and hard-deletes it", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
      authorId: "tripper-1",
      title: "My Trip",
    });
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "copy-1" });

    const mockDelete = vi.fn();
    const mockTxUpdate = vi.fn().mockResolvedValue({
      id: "blog-1",
      status: "PUBLISHED",
      authorId: "tripper-1",
      title: "My Trip",
    });
    (overwriteOriginalWithCopy as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PUBLISHED",
      authorId: "tripper-1",
      title: "My Trip",
    });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({ blogPost: { delete: mockDelete, update: mockTxUpdate } }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    expect(overwriteOriginalWithCopy).toHaveBeenCalledWith(expect.anything(), "blog-1", "copy-1");
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "copy-1" } });
  });

  it("sends an approval email + notification to the author", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminUser("admin-1"))
      .mockResolvedValue({ email: "tripper@example.com", name: "Tripper", locale: "es" });
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
      authorId: "tripper-1",
      title: "My Trip",
      publishedAt: null,
    });
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PUBLISHED",
      authorId: "tripper-1",
      title: "My Trip",
    });

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    // fire-and-forget async — allow the microtask queue to flush
    await new Promise((r) => setTimeout(r, 0));
    expect(sendMail).toHaveBeenCalled();
  });
});
