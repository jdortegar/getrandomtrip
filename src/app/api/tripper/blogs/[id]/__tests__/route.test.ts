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
    blogPost: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({ user: { id: userId, email: "user@example.com" } });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

const baseBlog = (authorId: string, overrides: Record<string, unknown> = {}) => ({
  id: "blog-1",
  authorId,
  status: "DRAFT",
  title: "My Trip",
  subtitle: "A subtitle",
  tagline: "A tagline",
  coverUrl: "https://example.com/cover.jpg",
  content: "<p>Body</p>",
  blocks: [],
  tags: ["adventure"],
  travelType: "solo",
  excuseKey: "solo-adventure",
  format: "ARTICLE",
  seo: null,
  faq: null,
  publishedAt: null,
  reviewLockedBy: null,
  createdAt: new Date("2020-01-01"),
  updatedAt: new Date("2020-01-01"),
  ...overrides,
});

function makePatchRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("http://localhost/api/tripper/blogs/blog-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Mocks `blogPost.findFirst` to resolve `blog` for the ownership lookup
 * (`where: { id, authorId }`) and `null` for the slug-uniqueness check
 * (`where: { slug, id: { not } }`) that fires when `title` changes — mirrors
 * the real DB behavior where a freshly-derived slug has no conflict.
 */
function mockOwnershipAndSlugLookup(blog: Record<string, unknown>) {
  (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockImplementation(
    ({ where }: { where: Record<string, unknown> }) => {
      if ("authorId" in where) return Promise.resolve(blog);
      return Promise.resolve(null); // no slug conflict
    },
  );
}

describe("PATCH /api/tripper/blogs/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseBlog("tripper-1"),
        ...data,
      }),
    );
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("ignores a client-sent status field — status only changes via guarded transition endpoints", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ title: "Updated", status: "published" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBeUndefined();
  });

  it("returns 409 locked_for_review when the post is PENDING_TRIPPER_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1", { status: "PENDING_TRIPPER_REVIEW" }));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("locked_for_review");
  });

  it("returns 409 locked_for_review when the post is PENDING_REVIEW — the client-side isReadOnly lock is UI-only, this is the real boundary", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1", { status: "PENDING_REVIEW" }));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Sneaky edit" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("locked_for_review");
  });

  it("reverts a PUBLISHED post to DRAFT and forces isActive: false when a content field changes", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(
      baseBlog("tripper-1", { status: "PUBLISHED", publishedAt: new Date("2020-01-01") }),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ title: "A brand new title" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBe("DRAFT");
    expect(updateCall.data.isActive).toBe(false);
    // publishedAt is KEPT, not nulled, on auto-revert
    expect(updateCall.data.publishedAt).toBeUndefined();
  });

  it("applies isActive from the request body as a plain visibility toggle, independent of status", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1", { status: "PUBLISHED" }));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ isActive: false }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.isActive).toBe(false);
    expect(updateCall.data.status).toBeUndefined();
  });

  it("does NOT revert a PUBLISHED post when nothing content-relevant changed (autosave no-op)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const existing = baseBlog("tripper-1", { status: "PUBLISHED" });
    mockOwnershipAndSlugLookup(existing);

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(
      makePatchRequest({
        title: existing.title,
        subtitle: existing.subtitle,
        tagline: existing.tagline,
        coverUrl: existing.coverUrl,
        content: existing.content,
        blocks: existing.blocks,
        tags: existing.tags,
        travelType: existing.travelType,
        excuseKey: existing.excuseKey,
        format: "article",
        seo: existing.seo,
        faq: existing.faq,
      }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBeUndefined();
  });

  it("does NOT revert when only a review-mechanism field changes (tripperNote)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const existing = baseBlog("tripper-1", { status: "PUBLISHED" });
    mockOwnershipAndSlugLookup(existing);

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(
      makePatchRequest({
        title: existing.title,
        subtitle: existing.subtitle,
        tagline: existing.tagline,
        coverUrl: existing.coverUrl,
        content: existing.content,
        blocks: existing.blocks,
        tags: existing.tags,
        travelType: existing.travelType,
        excuseKey: existing.excuseKey,
        format: "article",
        seo: existing.seo,
        faq: existing.faq,
        tripperNote: "a note for the admin",
      }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBeUndefined();
  });

  it("returns 404 when the post is not owned by the caller", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    expect(res.status).toBe(404);
  });

  it("excludes review copies from the ownership lookup — a tripper can never edit an admin's working copy through this route", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const ownershipCall = (
      prisma.blogPost.findFirst as ReturnType<typeof vi.fn>
    ).mock.calls.find(([{ where }]) => "authorId" in where)?.[0];
    expect(ownershipCall.where.isReviewCopy).toBe(false);
  });
});

describe("GET /api/tripper/blogs/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("excludes review copies from the lookup — a stale review-copy URL must 404, not resolve to the copy", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseBlog("tripper-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.GET(
      new NextRequest("http://localhost/api/tripper/blogs/blog-1"),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const call = (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.isReviewCopy).toBe(false);
  });
});

describe("DELETE /api/tripper/blogs/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.blogPost as unknown as { delete: ReturnType<typeof vi.fn> }).delete = vi.fn();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("excludes review copies from the ownership lookup before deleting", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseBlog("tripper-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.DELETE(
      new NextRequest("http://localhost/api/tripper/blogs/blog-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const call = (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.isReviewCopy).toBe(false);
  });

  it("returns 409 and does not delete when the post is PENDING_REVIEW — prevents orphaning a review copy", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseBlog("tripper-1", { status: "PENDING_REVIEW" }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      new NextRequest("http://localhost/api/tripper/blogs/blog-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("locked_for_review");
    expect(prisma.blogPost.delete).not.toHaveBeenCalled();
  });

  it("returns 409 and does not delete when the post is PENDING_TRIPPER_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseBlog("tripper-1", { status: "PENDING_TRIPPER_REVIEW" }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      new NextRequest("http://localhost/api/tripper/blogs/blog-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    expect(res.status).toBe(409);
    expect(prisma.blogPost.delete).not.toHaveBeenCalled();
  });

  it("deletes normally when the post is DRAFT", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseBlog("tripper-1", { status: "DRAFT" }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.DELETE(
      new NextRequest("http://localhost/api/tripper/blogs/blog-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    expect(res.status).toBe(204);
    expect(prisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: "blog-1" } });
  });
});
