import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    blogPost: { findFirst: vi.fn(), update: vi.fn() },
    // Interactive transaction: runs the callback against the same mock client.
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/blog/blogRepository", () => ({
  syncTranslationsFromLegacy: vi.fn(),
  writeTranslationsFromEditor: vi.fn().mockResolvedValue({}),
  getForEditor: vi.fn().mockResolvedValue({ id: "blog-1", translations: {} }),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { writeTranslationsFromEditor } from "@/lib/blog/blogRepository";

const mockSession = (userId: string) => ({ user: { id: userId, email: "user@example.com" } });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

const baseBlog = (authorId: string, overrides: Record<string, unknown> = {}) => ({
  id: "blog-1",
  authorId,
  source: "TRIPPER",
  status: "DRAFT",
  sourceLocale: "es",
  title: "My Trip",
  subtitle: "A subtitle",
  tagline: "A tagline",
  coverUrl: "https://example.com/cover.jpg",
  content: "<p>Body</p>",
  blocks: [],
  translationRows: [
    {
      locale: "es",
      title: "My Trip",
      subtitle: "A subtitle",
      tagline: "A tagline",
      content: "<p>Body</p>",
      blocks: [],
      isComplete: true,
    },
  ],
  tags: ["adventure"],
  travelType: ["solo"],
  excuseKey: ["solo-adventure"],
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
 * Mocks `blogPost.findFirst` to resolve `blog` for the ID lookup
 * (authorization runs after fetching) and `null` for the slug-uniqueness check
 * (`where: { slug, id: { not } }`) that fires when `title` changes — mirrors
 * the real DB behavior where a freshly-derived slug has no conflict.
 */
function mockOwnershipAndSlugLookup(blog: Record<string, unknown>) {
  (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockImplementation(
    ({ where }: { where: Record<string, unknown> }) => {
      if (where.id === blog.id) return Promise.resolve(blog);
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

  it("normalizes travelType/excuseKey on update — dedupes, trims, and drops non-strings/empty entries", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(
      makePatchRequest({
        travelType: ["solo", "solo", "  couple  ", 123, ""],
        excuseKey: ["solo", "solo", "  couple  ", 123, ""],
      }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.travelType).toEqual(["solo", "couple"]);
    expect(updateCall.data.excuseKey).toEqual(["solo", "couple"]);
  });

  it("detects an added travelType/excuseKey element as a content change and reverts a PUBLISHED post to DRAFT", async () => {
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
        travelType: [...existing.travelType, "couple"],
        excuseKey: existing.excuseKey,
        format: "article",
        seo: existing.seo,
        faq: existing.faq,
      }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBe("DRAFT");
  });

  it("removing a travelType element is detected as a content change and reverts a PUBLISHED post to DRAFT", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const existing = baseBlog("tripper-1", {
      status: "PUBLISHED",
      travelType: ["solo", "couple"],
    });
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
        travelType: ["solo"],
        excuseKey: existing.excuseKey,
        format: "article",
        seo: existing.seo,
        faq: existing.faq,
      }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBe("DRAFT");
  });

  it("current comparison semantics: reordering the same travelType elements IS treated as a content change (JSON.stringify is order-sensitive, the route does not sort before comparing)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const existing = baseBlog("tripper-1", {
      status: "PUBLISHED",
      travelType: ["solo", "couple"],
    });
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
        travelType: ["couple", "solo"], // same set, reordered
        excuseKey: existing.excuseKey,
        format: "article",
        seo: existing.seo,
        faq: existing.faq,
      }),
      { params: Promise.resolve({ id: "blog-1" }) },
    );

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBe("DRAFT");
  });

  it("returns 404 when the post does not exist", async () => {
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
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it.each([
    ["TRIPPER", "TRIPPER", 404],
    ["TRIPPER", "RANDOMTRIP", 404],
    ["ADMIN", "TRIPPER", 404],
    ["ADMIN", "RANDOMTRIP", 200],
  ])(
    "authorizes a fetched non-owner post: role=%s source=%s",
    async (role, source, status) => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession("caller"));
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "caller",
        roles: [role],
      } as Awaited<ReturnType<typeof prisma.user.findUnique>>);
      mockOwnershipAndSlugLookup(
        baseBlog("someone-else", { source, status: "PUBLISHED" }),
      );
      const { PATCH } = await import("../route");
      const res = await PATCH(makePatchRequest({ title: "Changed" }), {
        params: Promise.resolve({ id: "blog-1" }),
      });
      expect(res.status).toBe(status);
      if (status === 404) {
        expect(await res.json()).toEqual({
          error: "Blog post not found or access denied",
        });
        expect(prisma.blogPost.update).not.toHaveBeenCalled();
      } else {
        expect(vi.mocked(prisma.blogPost.update)).toHaveBeenCalled();
        expect(
          vi.mocked(prisma.blogPost.update).mock.calls[0][0].data,
        ).not.toHaveProperty("title");
        expect(
          vi.mocked(prisma.blogPost.update).mock.calls[0][0].data.status,
        ).toBeUndefined();
      }
    },
  );

  it("rejects an invalid level value with 400", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ level: "not-a-real-level" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    expect(res.status).toBe(400);
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("rejects level: 'xsed' from a non-admin tripper with 403", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ level: "xsed" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    expect(res.status).toBe(403);
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("allows an admin to set level: 'xsed' on a RANDOMTRIP post", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      roles: ["ADMIN"],
    });
    mockOwnershipAndSlugLookup(baseBlog("someone-else", { source: "RANDOMTRIP" }));

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ level: "xsed" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    expect(res.status).toBe(200);
    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.level).toBe("xsed");
  });

  it("allows a tripper to set a non-xsed level on their own post", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ level: "essenza" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.level).toBe("essenza");
  });

  it("clears level when the client sends an empty string", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1", { level: "essenza" }));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ level: "" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.level).toBeNull();
  });

  it("detects a level change as a content change and reverts a PUBLISHED post to DRAFT", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const existing = baseBlog("tripper-1", { status: "PUBLISHED", level: "essenza" });
    mockOwnershipAndSlugLookup(existing);

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ level: "modo-explora" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBe("DRAFT");
  });

  it("stores a trimmed label and clears it on an empty string", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ label: " XSED Nº1 (AR) " }), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    await mod.PATCH(makePatchRequest({ label: "" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const calls = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].data.label).toBe("XSED Nº1 (AR)");
    expect(calls[1][0].data.label).toBeNull();
  });

  it("detects a label change as a content change and reverts a PUBLISHED post to DRAFT", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1", { status: "PUBLISHED", label: "Old" }));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ label: "New" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.status).toBe("DRAFT");
  });

  it("does not write level when omitted from the request body", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    mockOwnershipAndSlugLookup(baseBlog("tripper-1", { level: "essenza" }));

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });

    const updateCall = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.level).toBeUndefined();
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
    ).mock.calls.find(([{ where }]) => where.id === "blog-1")?.[0];
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

describe("PATCH /api/tripper/blogs/[id] — editor translations and sourceLocale", () => {
  const completeEn = { title: "Trip", content: "<p>English</p>" };
  const ES = { title: "Viaje", content: "<p>Hola</p>", blocks: [{ type: "image" as const, url: "/a.jpg", caption: "Lago" }] };
  const EN = { title: "Trip", content: "<p>English</p>", blocks: [{ type: "image" as const, url: "/a.jpg", caption: "Lake" }] };
  const patch = async (body: Record<string, unknown>) => {
    const mod = (await import("../route")) as RouteModule;
    return mod.PATCH(makePatchRequest(body), {
      params: Promise.resolve({ id: "blog-1" }),
    });
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...baseBlog("tripper-1"),
        ...data,
      }),
    );
    vi.mocked(writeTranslationsFromEditor).mockResolvedValue({
      es: { ...ES, slug: "viaje", isComplete: true },
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("writes rows from the request and derives the legacy columns from them in one transaction", async () => {
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));
    const txUpdate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...baseBlog("tripper-1"),
      ...data,
    }));
    const tx = { blogPost: { update: txUpdate } };
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (fn: (client: unknown) => unknown) => fn(tx),
    );

    const res = await patch({
      sourceLocale: "es",
      translations: { es: ES, en: EN },
    });

    expect(res.status).toBe(200);
    expect(txUpdate.mock.calls[0][0].data).not.toHaveProperty("title");
    expect(txUpdate.mock.calls[0][0].data).not.toHaveProperty("translations");
    expect(writeTranslationsFromEditor).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: "blog-1", isReviewCopy: false, sourceLocale: "es" }),
      { es: ES, en: EN },
    );
  });

  it("overlays a legacy flat body on the current es row and keeps other locales", async () => {
    mockOwnershipAndSlugLookup(
      baseBlog("tripper-1", {
        translationRows: [
          { locale: "es", title: "Viaje", content: "<p>Hola</p>", blocks: [], isComplete: true },
          { locale: "en", title: "Trip", content: "<p>English</p>", blocks: [], isComplete: true },
        ],
      }),
    );
    await patch({ title: "Nuevo" });
    expect(vi.mocked(writeTranslationsFromEditor).mock.calls[0][2]).toMatchObject({
      es: { title: "Nuevo", content: "<p>Hola</p>" },
      en: { title: "Trip", content: "<p>English</p>" },
    });
  });

  it("leaves rows untouched when neither translations nor localized fields are sent", async () => {
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));
    const res = await patch({ isActive: false });
    expect(res.status).toBe(200);
    expect(writeTranslationsFromEditor).not.toHaveBeenCalled();
  });

  it("rejects an unsupported sourceLocale with 400", async () => {
    mockOwnershipAndSlugLookup(baseBlog("tripper-1"));
    const res = await patch({ sourceLocale: "fr" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_source_locale");
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("rejects changing sourceLocale to a locale whose translation is incomplete", async () => {
    mockOwnershipAndSlugLookup(
      baseBlog("tripper-1", { sourceLocale: "es", translations: null }),
    );
    const res = await patch({ sourceLocale: "en" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "source_locale_incomplete",
      locale: "en",
    });
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("accepts changing sourceLocale to a locale completed in the same request", async () => {
    mockOwnershipAndSlugLookup(
      baseBlog("tripper-1", { sourceLocale: "es", translations: null }),
    );
    const res = await patch({ sourceLocale: "en", translations: { en: completeEn } });
    expect(res.status).toBe(200);
    expect(
      (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0].data,
    ).toMatchObject({ sourceLocale: "en" });
  });

  it("does not re-check an unchanged sourceLocale", async () => {
    mockOwnershipAndSlugLookup(
      baseBlog("tripper-1", { sourceLocale: "en", translations: null }),
    );
    const res = await patch({ sourceLocale: "en", subtitle: "Otro" });
    expect(res.status).toBe(200);
  });
});
