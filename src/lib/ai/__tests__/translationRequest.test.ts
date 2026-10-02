import { describe, expect, it } from "vitest";
import {
  parseTranslationRequest,
  parseTranslationTexts,
  translationMessages,
  TranslationRequestError,
} from "@/lib/ai/translationRequest";

describe("parseTranslationRequest", () => {
  it("keeps html flags and rejects an unknown target", () => {
    expect(
      parseTranslationRequest({
        pieces: [{ html: true, text: "<p>Hola</p>" }],
        target: "en",
      }),
    ).toEqual({
      pieces: [{ html: true, text: "<p>Hola</p>" }],
      target: "en",
    });
    expect(() => parseTranslationRequest({ pieces: [{ html: false, text: "Hola" }], target: "fr" })).toThrow(
      TranslationRequestError,
    );
  });

  it("rejects an empty list and oversized copy", () => {
    expect(() => parseTranslationRequest({ pieces: [], target: "es" })).toThrow(TranslationRequestError);
    expect(() =>
      parseTranslationRequest({
        pieces: [{ html: false, text: "a".repeat(20_001) }],
        target: "es",
      }),
    ).toThrow(TranslationRequestError);
  });
});

describe("translation response", () => {
  it("asks the model to preserve HTML and returns one string per piece", () => {
    const messages = translationMessages({
      pieces: [{ html: true, text: "<p>Hola</p>" }],
      target: "en",
    });
    expect(messages.system).toContain("English");
    expect(messages.system).toContain("html is true");
    expect(parseTranslationTexts('{"texts":["<p>Hello</p>"]}', 1)).toEqual(["<p>Hello</p>"]);
    expect(() => parseTranslationTexts('{"texts":["Hello","extra"]}', 1)).toThrow(TranslationRequestError);
  });
});
