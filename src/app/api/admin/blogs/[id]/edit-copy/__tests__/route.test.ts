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
    blogPost: { findUnique: vi.fn(), update: vi.fn() },
    // Interactive transaction: runs the callback against the same mock client.
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/blog/blogRepository", () => ({
  syncTranslationsFromLegacy: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { syncTranslationsFromLegacy } from "@/lib/blog/blogRepository";

const mockSession = (userId: string) => ({ user: { id: userId, email: "admin@example.com" } });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

function makePatchRequest(id: string, body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest(`http://localhost/api/admin/blogs/${id}/edit-copy`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/blogs/[id]/edit-copy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1"), {
      params: Promise.resolve({ id: "copy-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1", { title: "Updated" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 forbidden unless the target isReviewCopy === true", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      isReviewCopy: false,
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("blog-1", { title: "Updated" }), {
      params: Promise.resolve({ id: "blog-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("writes allowed body fields to the copy and keeps slug null", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "DRAFT",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ id: "copy-1", ...data }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(
      makePatchRequest("copy-1", { title: "New Title", coverUrl: "https://example.com/x.jpg" }),
      { params: Promise.resolve({ id: "copy-1" }) },
    );
    expect(res.status).toBe(200);
    const updateArgs = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "copy-1" });
    expect(updateArgs.data.title).toBe("New Title");
    expect(updateArgs.data.coverUrl).toBe("https://example.com/x.jpg");
    expect(updateArgs.data).not.toHaveProperty("slug");
  });

  it("normalizes travelType/excuseKey — dedupes, trims, and drops non-strings/empty entries", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "DRAFT",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ id: "copy-1", ...data }),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(
      makePatchRequest("copy-1", {
        travelType: ["solo", "solo", "  couple  ", 123, ""],
        excuseKey: ["solo", "solo", "  couple  ", 123, ""],
      }),
      { params: Promise.resolve({ id: "copy-1" }) },
    );

    const updateArgs = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArgs.data.travelType).toEqual(["solo", "couple"]);
    expect(updateArgs.data.excuseKey).toEqual(["solo", "couple"]);
  });

  it("writes a valid level to the copy", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "DRAFT",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ id: "copy-1", ...data }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1", { level: "xsed" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });

    expect(res.status).toBe(200);
    const updateArgs = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArgs.data.level).toBe("xsed");
  });

  it("clears level when sent as an empty string", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "DRAFT",
    });
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ id: "copy-1", ...data }),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest("copy-1", { level: "" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });

    const updateArgs = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArgs.data.level).toBeNull();
  });

  it("rejects an invalid level value with 400", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "DRAFT",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1", { level: "not-a-real-level" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });

    expect(res.status).toBe(400);
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the blog post does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("copy-1", { title: "x" }), {
      params: Promise.resolve({ id: "copy-1" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/admin/blogs/[id]/edit-copy — translation dual-write", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("writes the copy's legacy columns and syncs its translation rows in the same transaction", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
      isReviewCopy: true,
      status: "PENDING_REVIEW",
    });
    const written = {
      id: "copy-1",
      isReviewCopy: true,
      title: "Nuevo",
      translations: { en: { title: "New", content: "<p>Body</p>", ready: true } },
    };
    const txUpdate = vi.fn().mockResolvedValue(written);
    const tx = { blogPost: { update: txUpdate } };
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (fn: (client: unknown) => unknown) => fn(tx),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(
      makePatchRequest("copy-1", {
        title: "Nuevo",
        translations: { en: { title: "New", content: "<p>Body</p>" } },
      }),
      { params: Promise.resolve({ id: "copy-1" }) },
    );

    expect(res.status).toBe(200);
    expect(txUpdate.mock.calls[0][0].data).toMatchObject({
      title: "Nuevo",
      translations: { en: { title: "New", content: "<p>Body</p>", ready: true } },
    });
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
    expect(syncTranslationsFromLegacy).toHaveBeenCalledWith(tx, written);
  });
});

describe("PATCH /api/admin/blogs/[id]/edit-copy — sourceLocale", () => {
  const storedCopy = {
    id: "copy-1",
    isReviewCopy: true,
    status: "DRAFT",
    sourceLocale: "es",
    title: "Mi viaje",
    content: "<p>Cuerpo</p>",
    blocks: [],
    translations: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(storedCopy);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: (client: unknown) => unknown) => fn(prisma),
    );
    (prisma.blogPost.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ ...storedCopy, ...data }),
    );
  });

  afterEach(() => {
    vi.resetModules();
  });

  async function patch(body: Record<string, unknown>) {
    const mod = (await import("../route")) as RouteModule;
    return mod.PATCH(makePatchRequest("copy-1", body), {
      params: Promise.resolve({ id: "copy-1" }),
    });
  }

  it("changes the copy's sourceLocale when that translation is complete after the request", async () => {
    const res = await patch({
      sourceLocale: "en",
      translations: { en: { title: "My trip", content: "<p>Body</p>" } },
    });
    expect(res.status).toBe(200);
    const data = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data.sourceLocale).toBe("en");
  });

  it("rejects a change to an incomplete translation with 400 source_locale_incomplete", async () => {
    const res = await patch({ sourceLocale: "en" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "source_locale_incomplete", locale: "en" });
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("rejects an unsupported locale with 400 invalid_source_locale", async () => {
    const res = await patch({ sourceLocale: "fr" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_source_locale" });
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it("does not write an unchanged sourceLocale", async () => {
    const res = await patch({ sourceLocale: "es", title: "Otro" });
    expect(res.status).toBe(200);
    const data = (prisma.blogPost.update as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data).not.toHaveProperty("sourceLocale");
  });
});
