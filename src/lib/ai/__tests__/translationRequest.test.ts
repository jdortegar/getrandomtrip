import { describe, expect, it } from "vitest";
import {
  batchTranslationPieces,
  parseTranslationRequest,
  parseTranslationTexts,
  TRANSLATION_BATCH_CHAR_LIMIT,
  TRANSLATION_BATCH_PIECE_LIMIT,
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

describe("batchTranslationPieces", () => {
  it("keeps a short list in one batch and splits by piece and character limits", () => {
    expect(batchTranslationPieces([{ html: false, text: "Hola" }])).toHaveLength(1);
    const many = Array.from({ length: TRANSLATION_BATCH_PIECE_LIMIT + 1 }, (_, index) => ({
      html: false,
      text: `Piece ${index}`,
    }));
    expect(batchTranslationPieces(many)).toHaveLength(2);
    expect(
      batchTranslationPieces([
        { html: true, text: "a".repeat(TRANSLATION_BATCH_CHAR_LIMIT - 10) },
        { html: true, text: "b".repeat(20) },
      ]),
    ).toHaveLength(2);
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
    expect(parseTranslationTexts('{"texts":["<p>Hello</p>","<p>There</p>"]}', 1)).toEqual([
      "<p>Hello</p><p>There</p>",
    ]);
    expect(() => parseTranslationTexts('{"texts":["Hello"]}', 2)).toThrow(TranslationRequestError);
  });
});
