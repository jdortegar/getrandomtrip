import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../blogRepository", () => ({
  overwriteTranslationsFromCopy: vi.fn(),
}));

import { computeChangedFields, overwriteOriginalWithCopy } from "../changed-fields";
import { overwriteTranslationsFromCopy } from "../blogRepository";

describe("computeChangedFields (blog)", () => {
  const base = {
    title: "My Trip",
    subtitle: "A subtitle",
    tagline: "A tagline",
    coverUrl: "https://example.com/cover.jpg",
    content: "<p>Body</p>",
    blocks: [{ type: "image", url: "https://example.com/1.jpg" }],
    tags: ["adventure"],
    travelType: "couple",
    excuseKey: "escapada-romantica",
    level: "essenza",
    format: "ARTICLE",
    seo: { title: "SEO title" },
    faq: { items: [{ question: "Q1", answer: "A1" }] },
    sourceLocale: "es",
  };

  const esRow = {
    locale: "es",
    title: "Mi viaje",
    subtitle: "Bajada",
    tagline: null,
    content: "<p>Cuerpo</p>",
    blocks: [{ type: "image", url: "https://example.com/1.jpg", caption: "Foto" }],
    faq: [{ question: "P1", answer: "R1" }],
    seo: { title: "SEO es", description: "Desc" },
    isComplete: true,
  };
  const enRow = {
    ...esRow,
    locale: "en",
    title: "My trip",
    blocks: [{ type: "image", url: "https://example.com/1.jpg", caption: "Photo" }],
    seo: { title: "SEO en", description: "Desc" },
  };
  const rows = { copy: [esRow, enRow], original: [esRow, enRow] };

  it("returns empty array when copy and original are identical", () => {
    expect(computeChangedFields({ ...base }, { ...base }, rows)).toEqual([]);
  });

  it("emits <locale>.<field> tokens for localized changes, per locale", () => {
    const result = computeChangedFields(base, base, {
      copy: [{ ...esRow, title: "Otro" }, { ...enRow, subtitle: "New sub" }],
      original: [esRow, enRow],
    });
    expect(result).toEqual(["es.title", "en.subtitle"]);
  });

  it("detects JSON changes per locale (blocks, faq, seo)", () => {
    const result = computeChangedFields(base, base, {
      copy: [
        esRow,
        {
          ...enRow,
          blocks: [{ type: "image", url: "https://example.com/2.jpg", caption: "Photo" }],
          faq: [],
          seo: { title: "Other" },
        },
      ],
      original: [esRow, enRow],
    });
    expect(result).toEqual(["en.blocks", "en.faq", "en.seo"]);
  });

  it("compares JSON fields key-order-insensitively (JSONB reorders keys)", () => {
    const reordered = {
      ...esRow,
      blocks: [{ caption: "Foto", url: "https://example.com/1.jpg", type: "image" }],
      seo: { description: "Desc", title: "SEO es" },
    };
    expect(
      computeChangedFields(base, base, { copy: [reordered, enRow], original: [esRow, enRow] }),
    ).toEqual([]);
  });

  it("emits <locale>.* for a locale present on only one side", () => {
    expect(
      computeChangedFields(base, base, { copy: [esRow, enRow], original: [esRow] }),
    ).toEqual(["en.*"]);
    expect(
      computeChangedFields(base, base, { copy: [esRow], original: [esRow, enRow] }),
    ).toEqual(["en.*"]);
  });

  it("never emits the legacy translations token or legacy Spanish column tokens", () => {
    const result = computeChangedFields(
      { ...base, title: "Changed", translations: { en: { title: "X" } } },
      { ...base, translations: null },
      rows,
    );
    expect(result).toEqual([]);
  });

  it("emits sourceLocale as a shared token", () => {
    expect(
      computeChangedFields({ ...base, sourceLocale: "en" }, base, rows),
    ).toEqual(["sourceLocale"]);
  });

  it("treats null and undefined as equivalent in localized scalars", () => {
    expect(
      computeChangedFields(base, base, {
        copy: [{ ...esRow, tagline: undefined }, enRow],
        original: [esRow, enRow],
      }),
    ).toEqual([]);
  });

  it("detects shared scalar and array changes", () => {
    const result = computeChangedFields(
      {
        ...base,
        coverUrl: "https://example.com/new.jpg",
        tags: ["adventure", "family"],
        travelType: ["solo", "couple"],
        excuseKey: ["solo-adventure"],
        level: "xsed",
        label: "XSED Nº2 (AR)",
      },
      { ...base, travelType: ["solo"], label: "XSED Nº1 (AR)" },
      rows,
    );
    expect(result).toEqual([
      "coverUrl",
      "tags",
      "travelType",
      "excuseKey",
      "level",
      "label",
    ]);
  });

  it("does NOT flag equal arrays or both-null scalars", () => {
    expect(
      computeChangedFields(
        { ...base, tags: ["adventure"], level: null },
        { ...base, tags: ["adventure"], level: null },
        rows,
      ),
    ).toEqual([]);
  });

  it("lists shared tokens first, then locales in CONTENT_LOCALES order", () => {
    expect(
      computeChangedFields({ ...base, format: "GUIDE" }, base, {
        copy: [{ ...enRow, title: "T" }, { ...esRow, content: "<p>x</p>" }],
        original: [esRow, enRow],
      }),
    ).toEqual(["format", "es.content", "en.title"]);
  });
});

describe("overwriteOriginalWithCopy (blog)", () => {
  function makeTx({
    copy,
    originalPublishedAt,
  }: {
    copy: Record<string, unknown>;
    originalPublishedAt: Date | null;
  }) {
    const findUnique = vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === "copy-1") return Promise.resolve(copy);
      if (where.id === "original-1") {
        return Promise.resolve({ id: "original-1", publishedAt: originalPublishedAt });
      }
      return Promise.resolve(null);
    });
    const update = vi.fn().mockImplementation(({ data }) => ({ id: "original-1", ...data }));
    return { blogPost: { findUnique, update } };
  }

  const copyRow = {
    id: "copy-1",
    title: "Copy Title",
    subtitle: "Copy Subtitle",
    tagline: "Copy Tagline",
    coverUrl: "https://example.com/copy.jpg",
    content: "<p>Copy content</p>",
    blocks: [],
    tags: ["copy-tag"],
    travelType: "solo",
    excuseKey: "solo-adventure",
    level: "xsed",
    format: "ARTICLE",
    seo: null,
    faq: null,
    slug: null,
    sourceLocale: "en",
  };

  beforeEach(() => {
    vi.mocked(overwriteTranslationsFromCopy).mockReset();
  });

  it("copies sourceLocale and overwrites translation rows from the copy (source-checked) after the legacy columns", async () => {
    const tx = makeTx({ copy: copyRow, originalPublishedAt: null });
    const order: string[] = [];
    tx.blogPost.update.mockImplementation(({ data }) => {
      order.push("legacy");
      return { id: "original-1", ...data };
    });
    vi.mocked(overwriteTranslationsFromCopy).mockImplementation(async () => {
      order.push("rows");
    });

    await overwriteOriginalWithCopy(tx, "original-1", "copy-1");

    expect(tx.blogPost.update.mock.calls[0][0].data.sourceLocale).toBe("en");
    expect(overwriteTranslationsFromCopy).toHaveBeenCalledWith(tx, "original-1", copyRow, {
      requireCompleteSource: true,
    });
    expect(order).toEqual(["legacy", "rows"]);
  });

  it("propagates the source guard error so the caller's transaction rolls back", async () => {
    const tx = makeTx({ copy: copyRow, originalPublishedAt: null });
    vi.mocked(overwriteTranslationsFromCopy).mockRejectedValue(new Error("source incomplete"));
    await expect(overwriteOriginalWithCopy(tx, "original-1", "copy-1")).rejects.toThrow(
      "source incomplete",
    );
  });

  it("copies mutable fields from copy to original, sets PUBLISHED, preserves original slug", async () => {
    const tx = makeTx({ copy: copyRow, originalPublishedAt: new Date("2020-01-01T00:00:00.000Z") });

    const result = (await overwriteOriginalWithCopy(tx, "original-1", "copy-1")) as Record<
      string,
      unknown
    >;

    expect(tx.blogPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "original-1" },
        data: expect.objectContaining({
          coverUrl: "https://example.com/copy.jpg",
          level: "xsed",
          sourceLocale: "en",
          status: "PUBLISHED",
          isActive: true,
          isReviewCopy: false,
          parentId: null,
          reviewLockedBy: null,
          reviewNote: null,
          changedFields: [],
        }),
      }),
    );
    // slug must NOT be part of the overwrite payload (preserves original slug)
    const callArgs = tx.blogPost.update.mock.calls[0][0];
    expect(callArgs.data).not.toHaveProperty("slug");
    expect(callArgs.data).not.toHaveProperty("title");
    expect(result.level).toBe("xsed");
  });

  it("sets publishedAt to now when original had none", async () => {
    const tx = makeTx({ copy: copyRow, originalPublishedAt: null });

    await overwriteOriginalWithCopy(tx, "original-1", "copy-1");

    const callArgs = tx.blogPost.update.mock.calls[0][0];
    expect(callArgs.data.publishedAt).toBeInstanceOf(Date);
  });

  it("keeps existing publishedAt when original already had one", async () => {
    const existingDate = new Date("2020-01-01T00:00:00.000Z");
    const tx = makeTx({ copy: copyRow, originalPublishedAt: existingDate });

    await overwriteOriginalWithCopy(tx, "original-1", "copy-1");

    const callArgs = tx.blogPost.update.mock.calls[0][0];
    expect(callArgs.data.publishedAt).toBe(existingDate);
  });
});
