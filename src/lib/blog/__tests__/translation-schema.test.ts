import { describe, expect, it } from "vitest";
import {
  blogTranslationInputSchema,
  blogTranslationsByLocaleSchema,
} from "../translation-schema";

const base = { title: "Title", content: "<p>Article</p>" };

describe("blogTranslationInputSchema", () => {
  it("accepts a full row payload including media blocks", () => {
    const input = {
      ...base,
      subtitle: "Sub",
      tagline: null,
      blocks: [
        { type: "section", title: "Day 1", description: "<p>Hi</p>" },
        { type: "image", url: "/a.jpg", caption: "Localized caption" },
        { type: "video", url: "/v.mp4" },
        { type: "embed", provider: "vimeo", url: "https://v/1", title: "Clip" },
        { type: "quote", text: "Q", cite: "Someone" },
        { type: "paragraph", text: "P" },
        { type: "faq", items: [{ question: "Q?", answer: "A" }] },
      ],
      faq: { items: [{ question: "Q?", answer: "A" }] },
      seo: { title: "SEO", description: "D", keywords: ["k"] },
    };
    expect(blogTranslationInputSchema.parse(input)).toEqual(input);
  });

  it("strips server-owned fields such as slug and isComplete", () => {
    const parsed = blogTranslationInputSchema.parse({
      ...base,
      slug: "forged",
      isComplete: true,
      ready: true,
    });
    expect(parsed).toEqual(base);
  });

  it("rejects malformed or oversized copy with the legacy limits", () => {
    expect(blogTranslationInputSchema.safeParse({ title: 123 }).success).toBe(
      false,
    );
    expect(
      blogTranslationInputSchema.safeParse({ title: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      blogTranslationInputSchema.safeParse({
        ...base,
        subtitle: "x".repeat(2_001),
      }).success,
    ).toBe(false);
    expect(
      blogTranslationInputSchema.safeParse({
        ...base,
        blocks: [{ type: "section", title: false }],
      }).success,
    ).toBe(false);
    expect(
      blogTranslationInputSchema.safeParse({
        ...base,
        blocks: Array.from({ length: 201 }, () => ({
          type: "paragraph",
          text: "p",
        })),
      }).success,
    ).toBe(false);
    expect(
      blogTranslationInputSchema.safeParse({
        ...base,
        blocks: [{ type: "embed", provider: "tiktok", url: "https://t/1" }],
      }).success,
    ).toBe(false);
    expect(
      blogTranslationInputSchema.safeParse({
        ...base,
        blocks: [{ type: "image", caption: "no url" }],
      }).success,
    ).toBe(false);
  });

  it("requires a title string but allows an empty draft title", () => {
    expect(blogTranslationInputSchema.safeParse({}).success).toBe(false);
    expect(blogTranslationInputSchema.safeParse({ title: "" }).success).toBe(
      true,
    );
  });
});

describe("blogTranslationsByLocaleSchema", () => {
  it("keys translations by supported locale and rejects unknown locales", () => {
    expect(
      blogTranslationsByLocaleSchema.parse({ es: base, en: base }),
    ).toEqual({ es: base, en: base });
    expect(blogTranslationsByLocaleSchema.parse({ en: base })).toEqual({
      en: base,
    });
    expect(
      blogTranslationsByLocaleSchema.safeParse({ fr: base }).success,
    ).toBe(false);
  });
});
