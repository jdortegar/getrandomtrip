import { describe, expect, it } from "vitest";
import {
  blogLocaleWhere,
  normalizeBlogTranslations,
  resolveBlogContent,
} from "../content-locale";

const english = { title: "English", content: "<p>Article</p>" };
const spanish = {
  title: "Español",
  subtitle: "Subtítulo",
  content: "<p>Artículo</p>",
  tagline: "Bajada",
  blocks: [{ type: "image", url: "/shared.jpg", caption: "Español" }],
  faq: { items: [{ question: "¿Qué?", answer: "Esto" }] },
  seo: { title: "SEO español" },
};

describe("blog content locales", () => {
  it("keeps canonical Spanish and omits absent or incomplete English", () => {
    expect(resolveBlogContent(spanish, "es")).toEqual(spanish);
    expect(resolveBlogContent(spanish, "en")).toBeNull();
    expect(
      resolveBlogContent(
        { ...spanish, translations: { en: { title: "Draft", ready: true } } },
        "en",
      ),
    ).toBeNull();
  });
  it("never fills optional English copy from Spanish, but shares gallery URLs", () => {
    const post = resolveBlogContent(
      { ...spanish, translations: normalizeBlogTranslations({ en: english }) },
      "en",
    );
    expect(post).toMatchObject({
      title: "English",
      content: "<p>Article</p>",
      subtitle: null,
      tagline: null,
      faq: null,
      seo: null,
      blocks: [{ type: "image", url: "/shared.jpg" }],
    });
  });
  it("derives readiness on the server and supports partial drafts and explicit clearing", () => {
    expect(
      normalizeBlogTranslations({
        en: { title: "Draft", content: "<p>&nbsp; </p>", ready: true },
      }),
    ).toMatchObject({ en: { ready: false } });
    expect(normalizeBlogTranslations({ en: english })).toMatchObject({
      en: { ready: true },
    });
    expect(normalizeBlogTranslations(undefined)).toBeUndefined();
    expect(normalizeBlogTranslations(null)).toBeNull();
    expect(normalizeBlogTranslations({ en: null })).toBeNull();
    expect(blogLocaleWhere("en")).toEqual({
      translations: { path: ["en", "ready"], equals: true },
    });
    expect(blogLocaleWhere("es")).toEqual({});
  });
  it("rejects blank structural sections even when stale flattened HTML is nonempty", () => {
    expect(
      normalizeBlogTranslations({
        en: {
          ...english,
          blocks: [{ type: "section", title: "", description: "<p><br></p>" }],
        },
      }),
    ).toMatchObject({ en: { ready: false } });
  });
  it("rejects malformed or excessive copy and keeps authored HTML unchanged", () => {
    expect(() => normalizeBlogTranslations({ en: { title: 123 } })).toThrow();
    expect(() =>
      normalizeBlogTranslations({ en: { title: "x".repeat(501) } }),
    ).toThrow();
    expect(() =>
      normalizeBlogTranslations({
        en: { blocks: [{ type: "section", title: false }] },
      }),
    ).toThrow();
    expect(normalizeBlogTranslations({ en: english })?.en?.content).toBe(
      english.content,
    );
  });
});
