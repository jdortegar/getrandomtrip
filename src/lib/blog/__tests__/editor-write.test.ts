import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  EditorWriteError,
  parseEditorWriteRequest,
  planEditorTranslations,
  translationsChanged,
} from "../editor-write";
import type { ReviewTranslationRow } from "../blogRepository";

const ES_HTML = "<p>Contenido</p>";
const EN_HTML = "<p>Content</p>";

function current(overrides: Partial<ReviewTranslationRow> = {}): ReviewTranslationRow {
  return {
    locale: "es",
    title: "Viaje",
    subtitle: null,
    tagline: null,
    content: ES_HTML,
    blocks: [],
    faq: null,
    seo: null,
    isComplete: true,
    ...overrides,
  };
}

const EN_ROW = current({ locale: "en", title: "Trip", content: EN_HTML });

function errorOf(run: () => unknown): EditorWriteError {
  try {
    run();
  } catch (error) {
    if (error instanceof EditorWriteError) return error;
    throw error;
  }
  throw new Error("expected an EditorWriteError");
}

describe("parseEditorWriteRequest", () => {
  it("passes editor translations keyed by locale through, stripping server-owned fields", () => {
    const request = parseEditorWriteRequest(
      {
        sourceLocale: "es",
        translations: {
          es: { title: "Viaje", content: ES_HTML, slug: "forged", isComplete: true },
          en: { title: "Trip", content: EN_HTML },
        },
      },
      { sourceLocale: "es", rows: [current()] },
    );
    expect(request.translations).toEqual({
      es: { title: "Viaje", content: ES_HTML },
      en: { title: "Trip", content: EN_HTML },
    });
    expect(request).toMatchObject({ sourceLocale: "es", sourceLocaleChanged: false });
  });

  it("rejects malformed translations with a ZodError", () => {
    expect(() =>
      parseEditorWriteRequest(
        { translations: { fr: { title: "Voyage" } } },
        { sourceLocale: "es", rows: [] },
      ),
    ).toThrow(ZodError);
  });

  it("maps a legacy flat create body (no translations) to the es translation", () => {
    const request = parseEditorWriteRequest(
      { title: "Viaje", subtitle: "Sub", content: ES_HTML },
      { sourceLocale: "es", rows: [], isCreate: true },
    );
    expect(request.translations).toEqual({
      es: { title: "Viaje", subtitle: "Sub", content: ES_HTML },
    });
  });

  it("overlays legacy flat fields on the current es row and keeps other locales on update", () => {
    const request = parseEditorWriteRequest(
      { title: "Nuevo" },
      { sourceLocale: "es", rows: [current(), EN_ROW] },
    );
    expect(request.translations?.es).toMatchObject({ title: "Nuevo", content: ES_HTML });
    expect(request.translations?.en).toMatchObject({ title: "Trip", content: EN_HTML });
  });

  it("leaves rows untouched when neither translations nor localized fields are sent", () => {
    const request = parseEditorWriteRequest({ isActive: true }, { sourceLocale: "es", rows: [current()] });
    expect(request.translations).toBeUndefined();
  });

  it("returns invalid_source_locale for an unsupported locale", () => {
    expect(
      errorOf(() => parseEditorWriteRequest({ sourceLocale: "fr" }, { sourceLocale: "es", rows: [] })).code,
    ).toBe("invalid_source_locale");
  });

  it("allows changing the source only to a locale that is complete after the request", () => {
    const incomplete = errorOf(() =>
      parseEditorWriteRequest(
        { sourceLocale: "en", translations: { es: { title: "Viaje", content: ES_HTML }, en: { title: "Trip", content: "<p></p>" } } },
        { sourceLocale: "es", rows: [current(), EN_ROW] },
      ),
    );
    expect(incomplete).toMatchObject({ code: "source_locale_incomplete", locale: "en" });

    expect(
      parseEditorWriteRequest(
        { sourceLocale: "en", translations: { es: { title: "Viaje", content: ES_HTML }, en: { title: "Trip", content: EN_HTML } } },
        { sourceLocale: "es", rows: [current()] },
      ),
    ).toMatchObject({ sourceLocale: "en", sourceLocaleChanged: true });

    expect(
      parseEditorWriteRequest({ sourceLocale: "en" }, { sourceLocale: "es", rows: [current(), EN_ROW] }),
    ).toMatchObject({ sourceLocale: "en", sourceLocaleChanged: true });
  });

  it("lets a new post start in any locale whose translation is present, even incomplete", () => {
    expect(
      parseEditorWriteRequest(
        { sourceLocale: "en", translations: { en: { title: "Draft" } } },
        { sourceLocale: "es", rows: [], isCreate: true },
      ),
    ).toMatchObject({ sourceLocale: "en" });
    expect(
      errorOf(() =>
        parseEditorWriteRequest(
          { sourceLocale: "en", translations: { es: { title: "Viaje" } } },
          { sourceLocale: "es", rows: [], isCreate: true },
        ),
      ),
    ).toMatchObject({ code: "source_locale_incomplete", locale: "en" });
  });
});

describe("planEditorTranslations", () => {
  it("orders rows by CONTENT_LOCALES, recomputes isComplete and keeps an omitted source row", () => {
    const rows = planEditorTranslations(
      { es: { title: "Viaje", content: "<p></p>" } },
      [current(), EN_ROW],
      "en",
    );
    expect(rows.map((row) => row.locale)).toEqual(["es", "en"]);
    expect(rows[0]).toMatchObject({ isComplete: false, blocks: [], subtitle: null });
    expect(rows[1]).toMatchObject({ title: "Trip", isComplete: true });
  });
});

describe("translationsChanged", () => {
  it("ignores identical content and detects caption edits and removed locales", () => {
    const image = { type: "image" as const, url: "/a.jpg", caption: "Lake" };
    const rows = [current(), current({ locale: "en", title: "Trip", content: EN_HTML, blocks: [image] })];
    expect(
      translationsChanged(
        { es: { title: "Viaje", content: ES_HTML }, en: { title: "Trip", content: EN_HTML, blocks: [image] } },
        rows,
        "es",
      ),
    ).toBe(false);
    expect(
      translationsChanged(
        {
          es: { title: "Viaje", content: ES_HTML },
          en: { title: "Trip", content: EN_HTML, blocks: [{ ...image, caption: "Lago" }] },
        },
        rows,
        "es",
      ),
    ).toBe(true);
    expect(translationsChanged({ es: { title: "Viaje", content: ES_HTML } }, rows, "es")).toBe(true);
  });
});
