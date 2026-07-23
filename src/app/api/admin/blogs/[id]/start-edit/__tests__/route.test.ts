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
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePostRequest(id: string): Request {
  return new Request(`http://localhost/api/admin/blogs/${id}/start-edit`, {
    method: "POST",
  });
}

const baseOriginal = (overrides: Record<string, unknown> = {}) => ({
  id: "blog-1",
  authorId: "tripper-1",
  status: "PENDING_REVIEW",
  reviewLockedBy: null,
  createdAt: new Date(),
  slug: "my-trip",
  isReviewCopy: false,
  parentId: null,
  reviewLockedByField: null,
  changedFields: [],
  updatedAt: new Date(),
  title: "My Trip",
  ...overrides,
});

describe("POST /api/admin/blogs/[id]/start-edit", () => {
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
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({
          blogPost: {
            findUnique: vi.fn().mockResolvedValue(baseOriginal({ status: "DRAFT" })),
          },
        }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 409 locked when another admin holds the lock", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-2"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminUser("admin-2"))
      .mockResolvedValue({ id: "admin-1", name: "Admin One", email: "admin1@example.com" });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({
          blogPost: {
            findUnique: vi.fn().mockResolvedValue(baseOriginal({ reviewLockedBy: "admin-1" })),
          },
        }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("locked");
  });

  it("is idempotent when the same admin already holds the lock and a copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({
          blogPost: {
            findUnique: vi.fn().mockResolvedValue(baseOriginal({ reviewLockedBy: "admin-1" })),
            findFirst: vi.fn().mockResolvedValue({ id: "copy-1" }),
          },
        }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.copyId).toBe("copy-1");
  });

  it("creates a review copy stripped of identity fields and sets the soft lock", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    const mockCreate = vi.fn().mockResolvedValue({ id: "new-copy-1" });
    const mockUpdate = vi.fn().mockResolvedValue({});
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({
          blogPost: {
            findUnique: vi.fn().mockResolvedValue(baseOriginal()),
            findFirst: vi.fn().mockResolvedValue(null), // no existing copy
            create: mockCreate,
            update: mockUpdate,
          },
        }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.copyId).toBe("new-copy-1");

    const createArgs = mockCreate.mock.calls[0][0];
    expect(createArgs.data.id).toBeUndefined();
    expect(createArgs.data.slug).toBeNull();
    expect(createArgs.data.isReviewCopy).toBe(true);
    expect(createArgs.data.isDiscarded).toBe(false);
    expect(createArgs.data.parentId).toBe("blog-1");
    expect(createArgs.data.status).toBe("DRAFT");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "blog-1" },
      data: { reviewLockedBy: "admin-1" },
    });
  });

  it("returns 404 when the blog post does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) =>
        cb({ blogPost: { findUnique: vi.fn().mockResolvedValue(null) } }),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(404);
  });
});
