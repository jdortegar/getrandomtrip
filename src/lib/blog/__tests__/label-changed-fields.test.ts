import { describe, expect, it } from "vitest";
import dictionary from "@/dictionaries/es.json";
import { labelBlogChangedFields } from "../label-changed-fields";

const dict = dictionary.tripperBlogs.form.changedFieldsBanner;

describe("labelBlogChangedFields", () => {
  it("labels locale-field tokens and a locale wildcard", () => {
    expect(labelBlogChangedFields(["en.title", "es.*"], dict)).toEqual([
      "Título (EN)",
      "Todo el contenido (ES)",
    ]);
  });

  it("labels shared tokens without a locale suffix", () => {
    expect(labelBlogChangedFields(["sourceLocale", "coverUrl"], dict)).toEqual([
      "Idioma original",
      "Imagen de portada",
    ]);
  });

  it("maps leftover legacy tokens to localized fields", () => {
    expect(labelBlogChangedFields(["title", "translations"], dict)).toEqual([
      "Título (ES)",
      "Título (EN)",
      "Subtítulo (EN)",
      "Bajada (EN)",
      "Artículo (EN)",
      "Secciones (EN)",
      "FAQ (EN)",
      "SEO (EN)",
    ]);
  });
});
