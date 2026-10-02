import { describe, expect, it } from "vitest";
import { applyBlogCopy, collectBlogCopy } from "@/lib/ai/translateBlogCopy";
import { mapBlogPostToDraft } from "@/lib/helpers/blog-form";
import type { BlogFormDraft } from "@/types/blog";

function draft(): BlogFormDraft {
  return {
    ...mapBlogPostToDraft({
      blocks: [
        { type: "quote", cite: "Ana", text: "El lago" },
        { type: "section", title: "Mañana", description: "<p>Caminata</p>" },
      ],
      faq: { items: [{ question: "¿Cuándo?", answer: "Al amanecer" }] },
      subtitle: "Una guía",
      tagline: "Salida",
      title: "Amanecer",
    }),
    seo: { description: "Ver el lago", title: "Amanecer SEO" },
  };
}

describe("collectBlogCopy", () => {
  it("keeps Spanish prose and skips an empty English draft", () => {
    const pieces = collectBlogCopy(draft(), "es");

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
    ]);
    expect(collectBlogCopy(draft(), "en")).toEqual([]);
  });
});

describe("applyBlogCopy", () => {
  it("stores the English translation without replacing Spanish", () => {
    const source = draft();
    const pieces = collectBlogCopy(source, "es").map((piece) => ({
      ...piece,
      text: `EN ${piece.text}`,
    }));

    const next = applyBlogCopy(source, "en", pieces);

    expect(next.title).toBe("Amanecer");
    expect(next.english?.title).toBe("EN Amanecer");
    expect(next.english?.sections[0]?.description).toBe("EN <p>Caminata</p>");
    expect(next.english?.seo?.title).toBe("EN Amanecer SEO");
  });

  it("writes a Spanish translation into the canonical fields", () => {
    const source = draft();
    source.english = {
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

    expect(next.title).toBe("ES Sunrise");
    expect(next.sections[0]?.title).toBe("ES Morning");
    expect(next.english?.title).toBe("Sunrise");
  });
});
