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
    blogPost: { findUnique: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
  },
}));

vi.mock("@/lib/helpers/sendMail", () => ({
  sendMail: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePostRequest(id: string, body: Record<string, unknown> = {}): Request {
  return new Request(`http://localhost/api/admin/blogs/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/blogs/[id]/reject", () => {
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
    const res = await mod.POST(makePostRequest("blog-1", { reviewNote: "fix this" }), {
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
    const res = await mod.POST(makePostRequest("blog-1", { reviewNote: "fix this" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 422 note_required on empty reviewNote", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1", { reviewNote: "  " }), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("note_required");
  });

  it("returns 200 and sets status to DRAFT with reviewNote persisted", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "DRAFT",
      authorId: "tripper-1",
      title: "My Trip",
      reviewNote: "Please fix the cover image",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("blog-1", { reviewNote: "Please fix the cover image" }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blog.status).toBe("DRAFT");
    expect(prisma.blogPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "blog-1" },
        data: expect.objectContaining({
          status: "DRAFT",
          isActive: false,
          reviewNote: "Please fix the cover image",
        }),
      }),
    );
  });

  it("returns 422 note_required (not 500) when the request body is empty/non-JSON", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      new Request("http://localhost/api/admin/blogs/blog-1/reject", { method: "POST" }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("note_required");
  });

  it("sends a rejection email to the author", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminUser("admin-1"))
      .mockResolvedValue({ email: "tripper@example.com", name: "Tripper", locale: "es" });
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "PENDING_REVIEW",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      status: "DRAFT",
      authorId: "tripper-1",
      title: "My Trip",
    });

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(makePostRequest("blog-1", { reviewNote: "fix this" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(sendMail).toHaveBeenCalled();
  });
});
