import { describe, it, expect, vi } from "vitest";
import { computeChangedFields, overwriteOriginalWithCopy } from "../changed-fields";

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
    format: "ARTICLE",
    seo: { title: "SEO title" },
    faq: { items: [{ question: "Q1", answer: "A1" }] },
  };

  it("returns empty array when copy and original are identical", () => {
    expect(computeChangedFields({ ...base }, { ...base })).toEqual([]);
  });

  it("detects scalar field change (title)", () => {
    const copy = { ...base, title: "New Title" };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("title");
    expect(result).not.toContain("subtitle");
  });

  it("detects JSON field change (blocks)", () => {
    const copy = { ...base, blocks: [{ type: "image", url: "https://example.com/2.jpg" }] };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("blocks");
  });

  it("does NOT flag JSON field as changed when content is deeply equal", () => {
    const copy = { ...base, blocks: [{ type: "image", url: "https://example.com/1.jpg" }] };
    const result = computeChangedFields(copy, base);
    expect(result).not.toContain("blocks");
  });

  it("detects array field change (tags)", () => {
    const copy = { ...base, tags: ["adventure", "family"] };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("tags");
  });

  it("does NOT flag array field as changed when arrays are equal", () => {
    const copy = { ...base, tags: ["adventure"] };
    const result = computeChangedFields(copy, base);
    expect(result).not.toContain("tags");
  });

  it("detects seo JSON change", () => {
    const copy = { ...base, seo: { title: "Different SEO" } };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("seo");
  });

  it("detects faq JSON change", () => {
    const copy = { ...base, faq: { items: [{ question: "Q2", answer: "A2" }] } };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("faq");
  });

  it("treats null and undefined as equivalent (no false positive)", () => {
    const copy = { ...base, tagline: undefined };
    const original = { ...base, tagline: null };
    const result = computeChangedFields(copy, original);
    expect(result).not.toContain("tagline");
  });

  it("detects multiple fields changed simultaneously", () => {
    const copy = {
      ...base,
      title: "Changed",
      subtitle: "Changed subtitle",
      coverUrl: "https://example.com/new.jpg",
    };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("title");
    expect(result).toContain("subtitle");
    expect(result).toContain("coverUrl");
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
    format: "ARTICLE",
    seo: null,
    faq: null,
    slug: null,
  };

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
          title: "Copy Title",
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
    expect(result.title).toBe("Copy Title");
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
