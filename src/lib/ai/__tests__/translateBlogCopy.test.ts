import { describe, expect, it } from "vitest";
import { applyBlogCopy, collectBlogCopy } from "@/lib/ai/translateBlogCopy";
import { mapBlogPostToDraft } from "@/lib/helpers/blog-form";
import type { BlogEditorDraft } from "@/types/blog";

function sourceDraft(): BlogEditorDraft {
  const mapped = mapBlogPostToDraft({
    blocks: [
      { type: "quote", cite: "Ana", text: "El lago" },
      { type: "section", title: "Mañana", description: "<p>Caminata</p>" },
      { type: "image", url: "/a.jpg", caption: "Lago" },
    ],
    faq: { items: [{ question: "¿Cuándo?", answer: "Al amanecer" }] },
    seo: { description: "Ver el lago", title: "Amanecer SEO" },
    subtitle: "Una guía",
    tagline: "Salida",
    title: "Amanecer",
  });
  return mapped;
}

describe("collectBlogCopy", () => {
  it("keeps Spanish prose and skips an empty English draft", () => {
    const source = sourceDraft();
    const pieces = collectBlogCopy(source, "es");

    expect(pieces.map((piece) => piece.text)).toEqual([
      "Amanecer",
      "Una guía",
      "Salida",
      "El lago",
      "Ana",
      "Mañana",
      "<p>Caminata</p>",
      "¿Cuándo?",
      "Al amanecer",
      "Amanecer SEO",
      "Ver el lago",
      "Lago",
    ]);
    expect(collectBlogCopy(source, "en")).toEqual([]);
  });
});

describe("applyBlogCopy", () => {
  it("stores the English translation without replacing Spanish", () => {
    const source = sourceDraft();
    const pieces = collectBlogCopy(source, "es").map((piece) => ({
      ...piece,
      text: `EN ${piece.text}`,
    }));

    const next = applyBlogCopy(source, "en", pieces);

    expect(next.translations.es?.title).toBe("Amanecer");
    expect(next.translations.en?.title).toBe("EN Amanecer");
    expect(next.translations.en?.sections[0]?.description).toBe("EN <p>Caminata</p>");
    expect(next.translations.en?.seo?.title).toBe("EN Amanecer SEO");
    expect(next.translations.en?.media?.[0]).toMatchObject({
      url: "/a.jpg",
      caption: "EN Lago",
    });
  });

  it("writes a Spanish translation into the source locale fields", () => {
    const source = sourceDraft();
    source.sourceLocale = "en";
    source.translations.en = {
      faq: [{ question: "When?", answer: "At sunrise" }],
      featureAttribution: "Ana",
      featureText: "The lake",
      sections: [{ description: "<p>Hike</p>", title: "Morning" }],
      seo: { description: "See the lake", title: "Sunrise SEO" },
      subtitle: "A guide",
      tagline: "Departure",
      title: "Sunrise",
    };

    const pieces = collectBlogCopy(source, "en").map((piece) => ({
      ...piece,
      text: `ES ${piece.text}`,
    }));
    const next = applyBlogCopy(source, "es", pieces);

    expect(next.translations.es?.title).toBe("ES Sunrise");
    expect(next.translations.es?.sections[0]?.title).toBe("ES Morning");
    expect(next.translations.en?.title).toBe("Sunrise");
  });
});
