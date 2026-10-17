import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  cloneTranslationsToCopy,
  loadTranslationsForReview,
  overwriteTranslationsFromCopy,
} from "../blogRepository";
import { SourceTranslationIncompleteError } from "../legacy-translation-mapping";

interface Row {
  id: string;
  postId: string;
  locale: string;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  content: string | null;
  blocks: unknown;
  faq: unknown;
  seo: unknown;
  slug: string | null;
  isComplete: boolean;
}

interface HistoryRow {
  locale: string;
  slug: string;
  translationId: string;
}

/** In-memory stand-in for the transaction client (where shapes the
 * repository uses for review copies). Json DbNull inputs are stored as null. */
function fakeTx(seed: { translations?: Row[]; history?: HistoryRow[] } = {}) {
  const translations: Row[] = (seed.translations ?? []).map((row) => ({ ...row }));
  const history: HistoryRow[] = [...(seed.history ?? [])];
  let next = 0;
  const normalize = (data: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value && typeof value === "object" && !Array.isArray(value) &&
        Object.keys(value).length === 0 && (value as object).constructor?.name !== "Object"
          ? null
          : value,
      ]),
    );
  const tx = {
    blogPostTranslation: {
      findMany: vi.fn(async ({ where }: { where: { postId: string } }) =>
        translations.filter((row) => row.postId === where.postId).map((row) => ({ ...row })),
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
      createMany: vi.fn(async ({ data }: { data: Omit<Row, "id">[] }) => {
        for (const row of data) {
          next += 1;
          translations.push({ id: `new-${next}`, ...(normalize(row) as Omit<Row, "id">) });
        }
        return { count: data.length };
      }),
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
            Object.assign(current, normalize(update));
            return { id: current.id };
          }
          next += 1;
          const created = { id: `new-${next}`, ...(normalize(create) as Omit<Row, "id">) };
          translations.push(created);
          return { id: created.id };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: { postId: string; locale: { in: string[] } } }) => {
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
          history.find((row) => row.locale === where.locale && row.slug === where.slug) ??
          null,
      ),
    },
  };
  return { tx, translations, history };
}

const text = (body: string) => `<p>${body}</p>`;

function row(overrides: Partial<Row> & Pick<Row, "id" | "postId" | "locale">): Row {
  return {
    title: "Title",
    subtitle: null,
    tagline: null,
    content: text("Body"),
    blocks: [],
    faq: null,
    seo: null,
    slug: null,
    isComplete: true,
    ...overrides,
  };
}

const ORIGINAL_ES = row({
  id: "orig-es",
  postId: "original",
  locale: "es",
  title: "Mi viaje",
  blocks: [{ type: "image", url: "https://x/1.jpg", caption: "Foto" }],
  slug: "mi-viaje",
});
const ORIGINAL_EN = row({
  id: "orig-en",
  postId: "original",
  locale: "en",
  title: "My trip",
  slug: "my-trip",
});

const copyPost = (overrides: Record<string, unknown> = {}) => ({
  id: "copy",
  title: "Mi viaje",
  content: text("Body"),
  blocks: [],
  sourceLocale: "es",
  ...overrides,
});

describe("cloneTranslationsToCopy", () => {
  it("clones every translation row of the original into the copy with a null slug", async () => {
    const { tx, translations } = fakeTx({ translations: [ORIGINAL_ES, ORIGINAL_EN] });

    await cloneTranslationsToCopy(tx as never, "original", "copy");

    const cloned = translations.filter((candidate) => candidate.postId === "copy");
    expect(cloned).toHaveLength(2);
    for (const original of [ORIGINAL_ES, ORIGINAL_EN]) {
      const copy = cloned.find((candidate) => candidate.locale === original.locale);
      expect(copy).toMatchObject({
        title: original.title,
        content: original.content,
        blocks: original.blocks,
        isComplete: original.isComplete,
        slug: null,
      });
    }
    // The original rows are untouched.
    expect(translations.find((r) => r.id === "orig-es")?.slug).toBe("mi-viaje");
  });

  it("does nothing when the original has no translation rows", async () => {
    const { tx } = fakeTx();
    await cloneTranslationsToCopy(tx as never, "original", "copy");
    expect(tx.blogPostTranslation.createMany).not.toHaveBeenCalled();
  });
});

describe("loadTranslationsForReview", () => {
  it("returns the post's translation rows keyed by locale order", async () => {
    const { tx } = fakeTx({ translations: [ORIGINAL_EN, ORIGINAL_ES] });
    const rows = await loadTranslationsForReview(tx as never, {
      id: "original",
    });
    expect(rows.map((r) => r.locale)).toEqual(["es", "en"]);
    expect(rows[0]).toMatchObject({ title: "Mi viaje", isComplete: true });
  });

  it("returns no rows when the post has none", async () => {
    const { tx } = fakeTx();
    const rows = await loadTranslationsForReview(tx as never, {
      id: "copy",
    });
    expect(rows).toEqual([]);
  });
});

describe("overwriteTranslationsFromCopy", () => {
  it("overwrites each locale from the copy while preserving the original's slugs and slug history", async () => {
    const history = [{ locale: "es", slug: "viejo-slug", translationId: "orig-es" }];
    const { tx, translations } = fakeTx({
      translations: [
        ORIGINAL_ES,
        ORIGINAL_EN,
        row({ id: "copy-es", postId: "copy", locale: "es", title: "Título nuevo" }),
        row({ id: "copy-en", postId: "copy", locale: "en", title: "New title" }),
      ],
      history,
    });

    await overwriteTranslationsFromCopy(tx as never, "original", copyPost(), {
      requireCompleteSource: true,
    });

    const es = translations.find((r) => r.postId === "original" && r.locale === "es");
    const en = translations.find((r) => r.postId === "original" && r.locale === "en");
    expect(es).toMatchObject({ id: "orig-es", title: "Título nuevo", slug: "mi-viaje" });
    expect(en).toMatchObject({ id: "orig-en", title: "New title", slug: "my-trip" });
    expect(history).toEqual([{ locale: "es", slug: "viejo-slug", translationId: "orig-es" }]);
  });

  it("deletes original locales the copy removed", async () => {
    const { tx, translations } = fakeTx({
      translations: [
        ORIGINAL_ES,
        ORIGINAL_EN,
        row({ id: "copy-es", postId: "copy", locale: "es", title: "Mi viaje" }),
      ],
    });

    await overwriteTranslationsFromCopy(tx as never, "original", copyPost(), {
      requireCompleteSource: true,
    });

    expect(
      translations.filter((r) => r.postId === "original").map((r) => r.locale),
    ).toEqual(["es"]);
  });

  it("gives a locale new on the original a slug from its title (T4 slug rules)", async () => {
    const { tx, translations } = fakeTx({
      translations: [
        ORIGINAL_ES,
        row({ id: "taken", postId: "other", locale: "en", title: "X", slug: "brand-new" }),
        row({ id: "copy-es", postId: "copy", locale: "es", title: "Mi viaje" }),
        row({ id: "copy-en", postId: "copy", locale: "en", title: "Brand new" }),
      ],
    });

    await overwriteTranslationsFromCopy(tx as never, "original", copyPost(), {
      requireCompleteSource: true,
    });

    const en = translations.find((r) => r.postId === "original" && r.locale === "en");
    expect(en).toMatchObject({ title: "Brand new", slug: "brand-new-2" });
  });

  it("recomputes isComplete instead of trusting the copy's flag", async () => {
    const { tx, translations } = fakeTx({
      translations: [
        ORIGINAL_ES,
        ORIGINAL_EN,
        row({ id: "copy-es", postId: "copy", locale: "es", title: "Mi viaje" }),
        row({
          id: "copy-en",
          postId: "copy",
          locale: "en",
          title: "No body",
          content: null,
          isComplete: true,
        }),
      ],
    });

    await overwriteTranslationsFromCopy(tx as never, "original", copyPost(), {
      requireCompleteSource: true,
    });

    const en = translations.find((r) => r.postId === "original" && r.locale === "en");
    expect(en?.isComplete).toBe(false);
  });

  it("throws before writing anything when the copy's source translation is incomplete", async () => {
    const { tx } = fakeTx({
      translations: [
        ORIGINAL_ES,
        ORIGINAL_EN,
        row({ id: "copy-es", postId: "copy", locale: "es", title: "Mi viaje" }),
        row({ id: "copy-en", postId: "copy", locale: "en", title: "", content: null }),
      ],
    });

    await expect(
      overwriteTranslationsFromCopy(tx as never, "original", copyPost({ sourceLocale: "en" }), {
        requireCompleteSource: true,
      }),
    ).rejects.toBeInstanceOf(SourceTranslationIncompleteError);
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
    expect(tx.blogPostTranslation.deleteMany).not.toHaveBeenCalled();
  });

  it("throws when the copy has no rows and the source must be complete", async () => {
    const { tx } = fakeTx({ translations: [ORIGINAL_ES, ORIGINAL_EN] });

    await expect(
      overwriteTranslationsFromCopy(
        tx as never,
        "original",
        copyPost(),
        { requireCompleteSource: true },
      ),
    ).rejects.toBeInstanceOf(SourceTranslationIncompleteError);
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
  });
});
