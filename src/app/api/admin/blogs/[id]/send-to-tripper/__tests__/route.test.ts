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
    blogPost: { findUnique: vi.fn(), findFirst: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendBlogPendingTripperReview: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendBlogPendingTripperReview } from "@/lib/email";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePostRequest(id: string, body: Record<string, unknown> = {}): Request {
  return new Request(`http://localhost/api/admin/blogs/${id}/send-to-tripper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const original = {
  id: "blog-1",
  authorId: "tripper-1",
  title: "My Trip",
  subtitle: "S",
  tagline: "T",
  coverUrl: "https://example.com/orig.jpg",
  content: "orig",
  blocks: [],
  tags: [],
  travelType: null,
  excuseKey: null,
  format: "ARTICLE",
  seo: null,
  faq: null,
};

describe("POST /api/admin/blogs/[id]/send-to-tripper", () => {
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

  it("returns 422 no_changes when computeChangedFields is empty", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(original);
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ ...original, id: "copy-1" });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("no_changes");
  });

  it("on success, sets copy changedFields + original PENDING_TRIPPER_REVIEW + clears lock", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(original);
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...original,
      id: "copy-1",
      title: "Changed Title",
    });

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
    const body = await res.json();
    expect(body.changedFields).toContain("title");

    expect(mockCopyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "copy-1" },
        data: expect.objectContaining({ changedFields: expect.arrayContaining(["title"]) }),
      }),
    );
    expect(mockOriginalUpdate).toHaveBeenCalledWith({
      where: { id: "blog-1" },
      data: { status: "PENDING_TRIPPER_REVIEW", reviewLockedBy: null },
    });
    expect(sendBlogPendingTripperReview).toHaveBeenCalledWith(
      "blog-1",
      "tripper-1",
      expect.arrayContaining(["title"]),
    );
  });

  it("returns 404 no_copy when no active review copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(original);
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("blog-1"), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("no_copy");
  });
});
