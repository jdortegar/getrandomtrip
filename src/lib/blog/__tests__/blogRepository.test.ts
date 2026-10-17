import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: { findMany: vi.fn() },
    blogPostTranslation: { findFirst: vi.fn(), findMany: vi.fn() },
    blogPostSlugHistory: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  availableLocales,
  findPublishedBySlug,
  listPublished,
  listPublishedLocaleSlugs,
} from "../blogRepository";

const translationFindFirst = vi.mocked(prisma.blogPostTranslation.findFirst);
const translationFindMany = vi.mocked(prisma.blogPostTranslation.findMany);
const historyFindFirst = vi.mocked(prisma.blogPostSlugHistory.findFirst);
const postFindMany = vi.mocked(prisma.blogPost.findMany);

const CUID = "c000000000000000000000000";
const PUBLIC_POST = {
  status: "PUBLISHED",
  isActive: true,
  isReviewCopy: false,
};

const post = {
  id: CUID,
  authorId: "author-1",
  coverUrl: "/cover.jpg",
  tags: ["Aventura"],
  travelType: ["solo"],
  excuseKey: [],
  level: null,
  label: null,
  format: "ARTICLE",
  source: "TRIPPER",
  publishedAt: new Date("2026-01-01"),
  createdAt: new Date("2025-12-01"),
  updatedAt: new Date("2026-01-02"),
  author: { id: "author-1", name: "Alex", tripperSlug: "alex" },
  translationRows: [
    { locale: "es", slug: "viaje" },
    { locale: "en", slug: "trip" },
  ],
};

function row(overrides: Record<string, unknown> = {}) {
  return {
    locale: "en",
    slug: "trip",
    title: "Trip",
    subtitle: null,
    tagline: null,
    content: "<p>Body</p>",
    blocks: null,
    faq: null,
    seo: null,
    post,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  translationFindFirst.mockResolvedValue(null);
  translationFindMany.mockResolvedValue([]);
  historyFindFirst.mockResolvedValue(null);
  postFindMany.mockResolvedValue([]);
});

describe("findPublishedBySlug", () => {
  it("finds a complete translation of a public post by (locale, slug) and flattens it", async () => {
    translationFindFirst.mockResolvedValueOnce(row() as never);

    const result = await findPublishedBySlug("en", "trip");

    expect(translationFindFirst.mock.calls[0][0]?.where).toEqual({
      locale: "en",
      slug: "trip",
      isComplete: true,
      post: PUBLIC_POST,
    });
    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.post).toMatchObject({
      id: CUID,
      slug: "trip",
      locale: "en",
      title: "Trip",
      content: "<p>Body</p>",
      coverUrl: "/cover.jpg",
      availableLocales: ["es", "en"],
      localeSlugs: { es: "viaje", en: "trip" },
    });
    expect(result.post.blocks).toBeUndefined();
  });

  it("is not_found when the translation is incomplete or the post is not public (query-level filter)", async () => {
    const result = await findPublishedBySlug("en", "draft-slug");
    expect(result).toEqual({ kind: "not_found" });
    expect(translationFindFirst.mock.calls[0][0]?.where).toMatchObject({
      isComplete: true,
      post: PUBLIC_POST,
    });
  });

  it("redirects a retired slug in this locale to the translation's current slug", async () => {
    historyFindFirst.mockImplementation((async (args: {
      where: { locale: unknown };
    }) =>
      args.where.locale === "en"
        ? { translation: { postId: CUID } }
        : null) as never);
    translationFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ slug: "trip" } as never);

    expect(await findPublishedBySlug("en", "old-trip")).toEqual({
      kind: "redirect",
      slug: "trip",
    });
    expect(translationFindFirst.mock.calls[1][0]?.where).toEqual({
      postId: CUID,
      locale: "en",
      isComplete: true,
      post: PUBLIC_POST,
    });
  });

  it("redirects another locale's slug to the requested locale's slug when translated", async () => {
    translationFindFirst.mockImplementation((async (args: {
      where: Record<string, unknown>;
    }) => {
      if (args.where.locale && typeof args.where.locale === "object")
        return { postId: CUID };
      if (args.where.postId === CUID) return { slug: "trip" };
      return null;
    }) as never);

    expect(await findPublishedBySlug("en", "viaje")).toEqual({
      kind: "redirect",
      slug: "trip",
    });
  });

  it("is not_found (no cross-locale fallback) when the post is untranslated in the requested locale", async () => {
    translationFindFirst.mockImplementation((async (args: {
      where: Record<string, unknown>;
    }) =>
      args.where.locale && typeof args.where.locale === "object"
        ? { postId: CUID }
        : null) as never);

    expect(await findPublishedBySlug("en", "viaje")).toEqual({
      kind: "not_found",
    });
  });

  it("redirects a legacy cuid param to the locale's slug", async () => {
    translationFindFirst.mockImplementation((async (args: {
      where: Record<string, unknown>;
    }) => (args.where.postId === CUID ? { slug: "viaje" } : null)) as never);

    expect(await findPublishedBySlug("es", CUID)).toEqual({
      kind: "redirect",
      slug: "viaje",
    });
  });

  it("does not resolve a non-cuid param by id", async () => {
    expect(await findPublishedBySlug("es", "not-an-id")).toEqual({
      kind: "not_found",
    });
    for (const [args] of translationFindFirst.mock.calls)
      expect(args?.where).not.toHaveProperty("postId");
  });
});

describe("listPublished", () => {
  it("filters by locale + isComplete + public post filters and sorts by publishedAt desc", async () => {
    translationFindMany.mockResolvedValueOnce([row()] as never);

    const result = await listPublished("en", {
      authorId: ["a", "b"],
      level: "xsed",
      travelType: "solo",
      excuseKey: "solo-adventure",
      requireCover: true,
      take: 5,
    });

    const args = translationFindMany.mock.calls[0][0];
    expect(args?.where).toEqual({
      locale: "en",
      isComplete: true,
      post: {
        ...PUBLIC_POST,
        authorId: { in: ["a", "b"] },
        level: "xsed",
        travelType: { has: "solo" },
        excuseKey: { has: "solo-adventure" },
        coverUrl: { not: null },
      },
    });
    expect(args?.orderBy).toEqual({ post: { publishedAt: "desc" } });
    expect(args?.take).toBe(5);
    expect(result[0]).toMatchObject({ id: CUID, slug: "trip", title: "Trip" });
  });

  it("searches the requested locale's translation title, case-insensitively", async () => {
    await listPublished("es", { search: " Perú ", orderBy: "createdAt" });

    const args = translationFindMany.mock.calls[0][0];
    expect(args?.where).toMatchObject({
      locale: "es",
      isComplete: true,
      title: { contains: "Perú", mode: "insensitive" },
    });
    expect(args?.orderBy).toEqual({ post: { createdAt: "desc" } });
    expect(args?.take).toBeUndefined();
  });

  it("falls back to the post id when a translation has no slug", async () => {
    translationFindMany.mockResolvedValueOnce([row({ slug: null })] as never);
    const [item] = await listPublished("en");
    expect(item.slug).toBe(CUID);
  });
});

describe("availableLocales", () => {
  it("returns complete locales in CONTENT_LOCALES order from loaded rows", async () => {
    expect(
      await availableLocales({
        translationRows: [
          { locale: "en", slug: "trip" },
          { locale: "es", slug: "viaje" },
        ],
      }),
    ).toEqual(["es", "en"]);
  });

  it("queries complete translations of a public post by id", async () => {
    translationFindMany.mockResolvedValueOnce([
      { locale: "en", slug: "trip" },
    ] as never);
    expect(await availableLocales(CUID)).toEqual(["en"]);
    expect(translationFindMany.mock.calls[0][0]?.where).toEqual({
      postId: CUID,
      isComplete: true,
      post: PUBLIC_POST,
    });
  });
});

describe("listPublishedLocaleSlugs", () => {
  it("returns each public post's complete locale slugs and skips untranslated posts", async () => {
    postFindMany.mockResolvedValueOnce([
      { id: "p1", updatedAt: post.updatedAt, translationRows: post.translationRows },
      { id: "p2", updatedAt: post.updatedAt, translationRows: [] },
    ] as never);

    expect(await listPublishedLocaleSlugs()).toEqual([
      {
        id: "p1",
        updatedAt: post.updatedAt,
        localeSlugs: { es: "viaje", en: "trip" },
      },
    ]);
    expect(postFindMany.mock.calls[0][0]?.where).toEqual(PUBLIC_POST);
  });
});
