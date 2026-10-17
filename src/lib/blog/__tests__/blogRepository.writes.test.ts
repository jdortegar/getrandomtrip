import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { syncTranslationsForPost } from "../blogRepository";
import {
  SourceTranslationIncompleteError,
  isLegacyLocaleComplete,
  type LegacyBlogContent,
} from "../legacy-translation-mapping";

interface Row {
  id: string;
  postId: string;
  locale: string;
  title: string;
  slug: string | null;
  isComplete: boolean;
}

function fakeTx(
  seed: {
    translations?: Row[];
    posts?: Record<string, unknown>[];
  } = {},
) {
  const translations: Row[] = (seed.translations ?? []).map((row) => ({ ...row }));
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
      upsert: vi.fn(),
    },
  };
  return { tx, translations };
}

const SPANISH_HTML = "<p>Contenido</p>";
const ENGLISH_HTML = "<p>Content</p>";

function post(overrides: Partial<LegacyBlogContent> = {}): LegacyBlogContent {
  return {
    title: "Viaje a Perú",
    subtitle: null,
    tagline: null,
    content: SPANISH_HTML,
    blocks: [],
    faq: null,
    seo: null,
    translations: null,
    ...overrides,
  };
}

describe("syncTranslationsForPost (contract: stored rows only)", () => {
  it("throws when requireCompleteSource and there are no rows", async () => {
    const { tx } = fakeTx({
      posts: [{ id: "p1", sourceLocale: "es" }],
    });
    await expect(
      syncTranslationsForPost(tx as never, "p1", { requireCompleteSource: true }),
    ).rejects.toBeInstanceOf(SourceTranslationIncompleteError);
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
  });

  it("throws when the stored source row is incomplete", async () => {
    const { tx } = fakeTx({
      posts: [{ id: "p1", sourceLocale: "en" }],
      translations: [
        { id: "t-en", postId: "p1", locale: "en", title: "Trip", slug: "trip", isComplete: false },
      ],
    });
    await expect(
      syncTranslationsForPost(tx as never, "p1", { requireCompleteSource: true }),
    ).rejects.toBeInstanceOf(SourceTranslationIncompleteError);
  });

  it("does not write when the stored source row is complete", async () => {
    const { tx } = fakeTx({
      posts: [{ id: "p1", sourceLocale: "es" }],
      translations: [
        { id: "t-es", postId: "p1", locale: "es", title: "Viaje", slug: "viaje", isComplete: true },
      ],
    });
    await syncTranslationsForPost(tx as never, "p1", { requireCompleteSource: true });
    expect(tx.blogPostTranslation.upsert).not.toHaveBeenCalled();
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
