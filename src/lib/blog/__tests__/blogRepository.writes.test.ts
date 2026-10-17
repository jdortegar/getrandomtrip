import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  syncTranslationsForPost,
  syncTranslationsFromLegacy,
  type LegacyBlogSnapshot,
} from "../blogRepository";
import {
  SourceTranslationIncompleteError,
  isLegacyLocaleComplete,
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

/** In-memory stand-in for the transaction client, matching the where shapes
 * the repository uses. */
function fakeTx(
  seed: {
    translations?: Row[];
    history?: HistoryRow[];
    posts?: Record<string, unknown>[];
  } = {},
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
        async ({
          where,
        }: {
          where: { locale: string; slug: string; id?: { not: string } };
        }) =>
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
        async ({
          where,
        }: {
          where: { postId: string; locale: { in: string[] } };
        }) => {
          let count = 0;
          for (let i = translations.length - 1; i >= 0; i -= 1) {
            const row = translations[i];
            if (row.postId === where.postId && where.locale.in.includes(row.locale)) {
              translations.splice(i, 1);
              count += 1;
            }
          }
          return { count };
        },
      ),
    },
    blogPostSlugHistory: {
      findFirst: vi.fn(
        async ({ where }: { where: { locale: string; slug: string } }) =>
          history.find(
            (row) => row.locale === where.locale && row.slug === where.slug,
          ) ?? null,
      ),
      upsert: vi.fn(
        async ({
          create,
        }: {
          where: unknown;
          create: HistoryRow;
          update: unknown;
        }) => {
          history.push(create);
          return create;
        },
      ),
    },
  };
  return { tx, translations, history };
}

const SPANISH_HTML = "<p>Contenido</p>";
const ENGLISH_HTML = "<p>Content</p>";

function post(overrides: Partial<LegacyBlogSnapshot> = {}): LegacyBlogSnapshot {
  return {
    id: "p1",
    title: "Viaje a Perú",
    subtitle: null,
    tagline: null,
    content: SPANISH_HTML,
    blocks: [],
    faq: null,
    seo: null,
    translations: null,
    publishedAt: null,
    isReviewCopy: false,
    ...overrides,
  };
}

function existing(overrides: Partial<Row> = {}): Row {
  return {
    id: "t-es",
    postId: "p1",
    locale: "es",
    title: "Viaje a Perú",
    content: SPANISH_HTML,
    slug: "viaje-a-peru",
    isComplete: true,
    ...overrides,
  };
}

const rowFor = (rows: Row[], locale: string) =>
  rows.find((row) => row.postId === "p1" && row.locale === locale);

describe("syncTranslationsFromLegacy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts es from the legacy columns and en from translations.en with Spanish media appended", async () => {
    const { tx, translations } = fakeTx();
    const image = { type: "image", url: "/a.jpg", caption: "Lago" };
    await syncTranslationsFromLegacy(
      tx as never,
      post({
        blocks: [{ type: "paragraph", text: "Hola" }, image],
        translations: { en: { title: "Trip to Peru", content: ENGLISH_HTML } },
      }),
    );
    expect(rowFor(translations, "es")).toMatchObject({
      title: "Viaje a Perú",
      content: SPANISH_HTML,
      slug: "viaje-a-peru",
      isComplete: true,
      blocks: [{ type: "paragraph", text: "Hola" }, image],
    });
    expect(rowFor(translations, "en")).toMatchObject({
      title: "Trip to Peru",
      content: ENGLISH_HTML,
      slug: "trip-to-peru",
      isComplete: true,
      blocks: [image],
    });
  });

  it("deletes the en row when legacy English was cleared", async () => {
    const { tx, translations } = fakeTx({
      translations: [
        existing(),
        existing({ id: "t-en", locale: "en", title: "Trip", slug: "trip" }),
      ],
    });
    await syncTranslationsFromLegacy(tx as never, post({ translations: null }));
    expect(rowFor(translations, "en")).toBeUndefined();
    expect(rowFor(translations, "es")).toBeDefined();
    expect(tx.blogPostTranslation.deleteMany).toHaveBeenCalledWith({
      where: { postId: "p1", locale: { in: ["en"] } },
    });
  });

  it("leaves the en row untouched when the legacy English JSON is invalid", async () => {
    const enRow = existing({ id: "t-en", locale: "en", title: "Trip", slug: "trip" });
    const { tx, translations } = fakeTx({ translations: [existing(), enRow] });
    await syncTranslationsFromLegacy(
      tx as never,
      post({ translations: { en: { title: 12 } } }),
    );
    expect(rowFor(translations, "en")).toMatchObject({ title: "Trip", slug: "trip" });
    expect(tx.blogPostTranslation.deleteMany).not.toHaveBeenCalled();
  });

  it("recomputes isComplete server-side and ignores a forged ready flag", async () => {
    const { tx, translations } = fakeTx();
    await syncTranslationsFromLegacy(
      tx as never,
      post({
        content: "<p>&nbsp;</p>",
        translations: { en: { title: "Draft", ready: true } },
      }),
    );
    expect(rowFor(translations, "es")?.isComplete).toBe(false);
    expect(rowFor(translations, "en")?.isComplete).toBe(false);
    expect(rowFor(translations, "en")).not.toHaveProperty("ready");
  });

  it("lets the slug follow the title before first publish without writing history", async () => {
    const { tx, translations, history } = fakeTx({
      translations: [existing({ title: "Viejo título", slug: "viejo-titulo" })],
    });
    await syncTranslationsFromLegacy(
      tx as never,
      post({ title: "Nuevo título", publishedAt: null }),
    );
    expect(rowFor(translations, "es")).toMatchObject({
      title: "Nuevo título",
      slug: "nuevo-titulo",
    });
    expect(history).toEqual([]);
  });

  it("keeps the slug when an unpublished title did not change", async () => {
    const { tx, translations } = fakeTx({
      translations: [existing({ slug: "custom-slug" })],
    });
    await syncTranslationsFromLegacy(tx as never, post());
    expect(rowFor(translations, "es")?.slug).toBe("custom-slug");
  });

  it("freezes the slug after publish even when the title changes", async () => {
    const { tx, translations, history } = fakeTx({
      translations: [existing()],
    });
    await syncTranslationsFromLegacy(
      tx as never,
      post({ title: "Otro título", publishedAt: new Date("2026-01-01") }),
    );
    expect(rowFor(translations, "es")).toMatchObject({
      title: "Otro título",
      slug: "viaje-a-peru",
    });
    expect(history).toEqual([]);
  });

  it("regenerates a published slug only on explicit request and records the old one", async () => {
    const { tx, translations, history } = fakeTx({
      translations: [
        existing(),
        existing({ id: "t-en", locale: "en", title: "Trip", slug: "trip" }),
      ],
    });
    await syncTranslationsFromLegacy(
      tx as never,
      post({
        title: "Otro título",
        publishedAt: new Date("2026-01-01"),
        translations: { en: { title: "Another trip", content: ENGLISH_HTML } },
      }),
      { regenerateSlug: { es: true } },
    );
    expect(rowFor(translations, "es")?.slug).toBe("otro-titulo");
    expect(rowFor(translations, "en")?.slug).toBe("trip");
    expect(history).toEqual([
      { locale: "es", slug: "viaje-a-peru", translationId: "t-es" },
    ]);
  });

  it("gives review copies a null slug", async () => {
    const { tx, translations } = fakeTx();
    await syncTranslationsFromLegacy(
      tx as never,
      post({
        isReviewCopy: true,
        translations: { en: { title: "Trip", content: ENGLISH_HTML } },
      }),
    );
    expect(rowFor(translations, "es")?.slug).toBeNull();
    expect(rowFor(translations, "en")?.slug).toBeNull();
    expect(tx.blogPostTranslation.findFirst).not.toHaveBeenCalled();
  });

  it("keeps new slugs unique per locale against live and retired slugs", async () => {
    const { tx, translations } = fakeTx({
      translations: [
        existing({ id: "other-es", postId: "p2", slug: "viaje-a-peru" }),
        existing({ id: "other-en", postId: "p2", locale: "en", slug: "viaje-a-peru-3" }),
      ],
      history: [{ locale: "es", slug: "viaje-a-peru-2", translationId: "other-es" }],
    });
    await syncTranslationsFromLegacy(tx as never, post());
    // -3 is only taken in `en`, so it is free in `es`.
    expect(rowFor(translations, "es")?.slug).toBe("viaje-a-peru-3");
  });
});

describe("syncTranslationsForPost", () => {
  it("rejects a post whose source translation is incomplete without writing", async () => {
    const { tx } = fakeTx({
      posts: [{ ...post(), sourceLocale: "en", translations: null }],
    });
    await expect(
      syncTranslationsForPost(tx as never, "p1", { requireCompleteSource: true }),
    ).rejects.toBeInstanceOf(SourceTranslationIncompleteError);
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
  });

  it("syncs a post whose source translation is complete", async () => {
    const { tx, translations } = fakeTx({
      posts: [{ ...post(), sourceLocale: "es" }],
    });
    await syncTranslationsForPost(tx as never, "p1", {
      requireCompleteSource: true,
    });
    expect(rowFor(translations, "es")?.slug).toBe("viaje-a-peru");
  });
});

describe("isLegacyLocaleComplete", () => {
  it("evaluates es from the columns and en from translations.en", () => {
    const legacy = post({
      translations: { en: { title: "Trip", content: ENGLISH_HTML } },
    });
    expect(isLegacyLocaleComplete(legacy, "es")).toBe(true);
    expect(isLegacyLocaleComplete(legacy, "en")).toBe(true);
    expect(isLegacyLocaleComplete(post({ translations: null }), "en")).toBe(false);
    expect(isLegacyLocaleComplete(post({ content: "" }), "es")).toBe(false);
  });
});
