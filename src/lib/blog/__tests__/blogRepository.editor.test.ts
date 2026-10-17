import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { blogPost: { findUnique } } }));

import {
  getForEditor,
  syncTranslationsForPost,
  writeTranslationsFromEditor,
  type EditorWriteTarget,
} from "../blogRepository";
import {
  SourceTranslationIncompleteError,
} from "../legacy-translation-mapping";

interface Row {
  id: string;
  postId: string;
  locale: string;
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: unknown;
  faq?: unknown;
  seo?: unknown;
  slug: string | null;
  isComplete: boolean;
}

interface HistoryRow {
  locale: string;
  slug: string;
  translationId: string;
}

function fakeTx(
  seed: { translations?: Row[]; history?: HistoryRow[]; posts?: Record<string, unknown>[] } = {},
) {
  const translations: Row[] = (seed.translations ?? []).map((row) => ({ ...row }));
  const history: HistoryRow[] = [...(seed.history ?? [])];
  let next = 0;
  const tx = {
    blogPost: {
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          seed.posts?.find((post) => post.id === where.id) ?? null,
      ),
    },
    blogPostTranslation: {
      findMany: vi.fn(async ({ where }: { where: { postId: string } }) =>
        translations.filter((row) => row.postId === where.postId),
      ),
      findFirst: vi.fn(
        async ({ where }: { where: { locale: string; slug: string; id?: { not: string } } }) =>
          translations.find(
            (row) =>
              row.locale === where.locale &&
              row.slug === where.slug &&
              (!where.id || row.id !== where.id.not),
          ) ?? null,
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { postId_locale: { postId: string; locale: string } };
          create: Omit<Row, "id">;
          update: Partial<Row>;
        }) => {
          const { postId, locale } = where.postId_locale;
          const current = translations.find(
            (row) => row.postId === postId && row.locale === locale,
          );
          if (current) {
            Object.assign(current, update);
            return { id: current.id };
          }
          next += 1;
          const created = { id: `new-${next}`, ...create } as Row;
          translations.push(created);
          return { id: created.id };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: { postId: string; locale: { in: string[] } } }) => {
          for (let i = translations.length - 1; i >= 0; i -= 1) {
            const row = translations[i];
            if (row.postId === where.postId && where.locale.in.includes(row.locale))
              translations.splice(i, 1);
          }
          return { count: 0 };
        },
      ),
    },
    blogPostSlugHistory: {
      findFirst: vi.fn(
        async ({ where }: { where: { locale: string; slug: string } }) =>
          history.find((row) => row.locale === where.locale && row.slug === where.slug) ??
          null,
      ),
      upsert: vi.fn(async ({ create }: { create: HistoryRow }) => {
        history.push(create);
        return create;
      }),
    },
  };
  return { tx, translations, history };
}

const ES_HTML = "<p>Contenido</p>";
const EN_HTML = "<p>Content</p>";
const IMAGE_ES = { type: "image" as const, url: "/a.jpg", caption: "Lago" };
const IMAGE_EN = { type: "image" as const, url: "/a.jpg", caption: "Lake" };

function target(overrides: Partial<EditorWriteTarget> = {}): EditorWriteTarget {
  return {
    id: "p1",
    publishedAt: null,
    isReviewCopy: false,
    sourceLocale: "es",
    ...overrides,
  };
}

function row(overrides: Partial<Row> = {}): Row {
  return {
    id: "t-es",
    postId: "p1",
    locale: "es",
    title: "Viaje a Perú",
    content: ES_HTML,
    blocks: [],
    slug: "viaje-a-peru",
    isComplete: true,
    ...overrides,
  };
}

const rowFor = (rows: Row[], locale: string) =>
  rows.find((candidate) => candidate.postId === "p1" && candidate.locale === locale);

describe("writeTranslationsFromEditor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes every requested locale with its own media captions, slug and server-computed isComplete", async () => {
    const { tx, translations } = fakeTx();
    const result = await writeTranslationsFromEditor(tx as never, target(), {
      es: { title: "Viaje a Perú", content: ES_HTML, blocks: [IMAGE_ES] },
      en: { title: "Trip to Peru", content: "<p>&nbsp;</p>", blocks: [IMAGE_EN] },
    });
    expect(rowFor(translations, "es")).toMatchObject({
      blocks: [IMAGE_ES],
      isComplete: true,
      slug: "viaje-a-peru",
    });
    expect(rowFor(translations, "en")).toMatchObject({
      blocks: [IMAGE_EN],
      isComplete: false,
      slug: "trip-to-peru",
    });
    expect(result.en).toMatchObject({ slug: "trip-to-peru", isComplete: false });
    expect(result.es).toMatchObject({ slug: "viaje-a-peru", isComplete: true });
  });

  it("deletes a non-source locale omitted from the request", async () => {
    const { tx, translations } = fakeTx({
      translations: [row(), row({ id: "t-en", locale: "en", title: "Trip", slug: "trip" })],
    });
    const result = await writeTranslationsFromEditor(tx as never, target(), {
      es: { title: "Viaje a Perú", content: ES_HTML },
    });
    expect(rowFor(translations, "en")).toBeUndefined();
    expect(tx.blogPostTranslation.deleteMany).toHaveBeenCalledWith({
      where: { postId: "p1", locale: { in: ["en"] } },
    });
    expect(Object.keys(result)).toEqual(["es"]);
  });

  it("never deletes the source locale when the request omits it", async () => {
    const enSource = row({ id: "t-en", locale: "en", title: "Trip", slug: "trip", content: EN_HTML });
    const { tx, translations } = fakeTx({ translations: [row(), enSource] });
    const result = await writeTranslationsFromEditor(
      tx as never,
      target({ sourceLocale: "en" }),
      { es: { title: "Viaje", content: ES_HTML } },
    );
    expect(rowFor(translations, "en")).toMatchObject({ title: "Trip", slug: "trip" });
    expect(result.en).toMatchObject({ title: "Trip", slug: "trip", isComplete: true });
    expect(tx.blogPostTranslation.deleteMany).not.toHaveBeenCalled();
  });

  it("keeps a review copy's per-locale captions across saves and its slugs null", async () => {
    const { tx, translations } = fakeTx({
      translations: [
        row({ slug: null, blocks: [IMAGE_ES] }),
        row({ id: "t-en", locale: "en", title: "Trip", slug: null, blocks: [IMAGE_EN] }),
      ],
    });
    await writeTranslationsFromEditor(tx as never, target({ isReviewCopy: true }), {
      es: { title: "Viaje editado", content: ES_HTML, blocks: [IMAGE_ES] },
      en: { title: "Trip", content: EN_HTML, blocks: [IMAGE_EN] },
    });
    expect(rowFor(translations, "en")).toMatchObject({ blocks: [IMAGE_EN], slug: null });
    expect(rowFor(translations, "es")).toMatchObject({ title: "Viaje editado", slug: null });
    expect(tx.blogPostTranslation.findFirst).not.toHaveBeenCalled();
  });

  it("regenerates published slugs when the title changes and retires the old ones", async () => {
    const { tx, translations, history } = fakeTx({
      translations: [row(), row({ id: "t-en", locale: "en", title: "Trip", slug: "trip" })],
    });
    await writeTranslationsFromEditor(
      tx as never,
      target({ publishedAt: new Date("2026-01-01") }),
      {
        es: { title: "Otro título", content: ES_HTML },
        en: { title: "Another trip", content: EN_HTML },
      },
    );
    expect(rowFor(translations, "es")?.slug).toBe("otro-titulo");
    expect(rowFor(translations, "en")?.slug).toBe("another-trip");
    expect(history).toEqual([
      { locale: "es", slug: "viaje-a-peru", translationId: "t-es" },
      { locale: "en", slug: "trip", translationId: "t-en" },
    ]);
  });

  it("lets unpublished slugs follow the title", async () => {
    const { tx, translations } = fakeTx({ translations: [row()] });
    await writeTranslationsFromEditor(tx as never, target(), {
      es: { title: "Nuevo título", content: ES_HTML },
    });
    expect(rowFor(translations, "es")?.slug).toBe("nuevo-titulo");
  });
});

describe("syncTranslationsForPost (rows are authoritative)", () => {
  it("does not re-derive existing rows from the legacy columns", async () => {
    const { tx, translations } = fakeTx({
      posts: [{ id: "p1", title: "Legacy", content: ES_HTML, blocks: [], translations: null, publishedAt: null, isReviewCopy: false, sourceLocale: "es" }],
      translations: [row(), row({ id: "t-en", locale: "en", title: "Trip", blocks: [IMAGE_EN] })],
    });
    await syncTranslationsForPost(tx as never, "p1", { requireCompleteSource: true });
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
    expect(rowFor(translations, "en")?.blocks).toEqual([IMAGE_EN]);
  });

  it("checks the stored source row's completeness", async () => {
    const { tx } = fakeTx({
      posts: [{ id: "p1", title: "Legacy", content: ES_HTML, blocks: [], translations: null, publishedAt: null, isReviewCopy: false, sourceLocale: "en" }],
      translations: [row(), row({ id: "t-en", locale: "en", title: "Trip", isComplete: false })],
    });
    await expect(
      syncTranslationsForPost(tx as never, "p1", { requireCompleteSource: true }),
    ).rejects.toBeInstanceOf(SourceTranslationIncompleteError);
  });
});

describe("getForEditor", () => {
  beforeEach(() => findUnique.mockReset());

  it("returns shared fields plus translations keyed by locale with slug and isComplete", async () => {
    findUnique.mockResolvedValue({
      id: "p1",
      authorId: "u1",
      source: "TRIPPER",
      status: "PUBLISHED",
      format: "ARTICLE",
      sourceLocale: "en",
      coverUrl: "/c.jpg",
      tags: [],
      travelType: [],
      excuseKey: [],
      level: null,
      label: null,
      isActive: true,
      isReviewCopy: false,
      parentId: null,
      reviewNote: null,
      tripperNote: null,
      reviewLockedBy: null,
      changedFields: [],
      publishedAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      author: null,
      translationRows: [
        { locale: "en", title: "Trip", subtitle: null, tagline: null, content: EN_HTML, blocks: [IMAGE_EN], faq: null, seo: null, slug: "trip", isComplete: true },
        { locale: "es", title: "Viaje", subtitle: null, tagline: null, content: ES_HTML, blocks: [IMAGE_ES], faq: null, seo: null, slug: "viaje", isComplete: false },
      ],
    });
    const post = await getForEditor("p1");
    expect(post).toMatchObject({
      id: "p1",
      sourceLocale: "en",
      translations: {
        en: { title: "Trip", blocks: [IMAGE_EN], slug: "trip", isComplete: true },
        es: { title: "Viaje", blocks: [IMAGE_ES], slug: "viaje", isComplete: false },
      },
    });
    expect(post).not.toHaveProperty("translationRows");
    expect(post).not.toHaveProperty("title");
  });

  it("returns empty translations when the post has no rows", async () => {
    findUnique.mockResolvedValue({
      id: "p1",
      sourceLocale: "es",
      changedFields: null,
      translationRows: [],
    });
    const post = await getForEditor("p1");
    expect(post?.translations).toEqual({});
    expect(post?.changedFields).toEqual([]);
  });

  it("returns null for a missing post", async () => {
    findUnique.mockResolvedValue(null);
    await expect(getForEditor("nope")).resolves.toBeNull();
  });
});
