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
    blogPost: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePostRequest(id: string): Request {
  return new Request(`http://localhost/api/admin/blogs/${id}/discard-copy`, { method: "POST" });
}

describe("POST /api/admin/blogs/[id]/discard-copy", () => {
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

  it("returns 404 no_copy when no active review copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "PENDING_REVIEW",
    });
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("no_copy");
  });

  it("returns 409 invalid_state when the original is no longer PENDING_REVIEW — prevents orphaning a copy already sent to the tripper", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "PENDING_TRIPPER_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("invalid_state");
    expect(prisma.blogPost.findFirst).not.toHaveBeenCalled();
  });

  it("hard-deletes the copy and clears reviewLockedBy; original stays PENDING_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "PENDING_REVIEW",
    });
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "copy-1" });

    const mockDelete = vi.fn();
    const mockUpdate = vi.fn();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({ blogPost: { delete: mockDelete, update: mockUpdate } }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "copy-1" } });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "blog-1" },
      data: { reviewLockedBy: null },
    });
  });
});
