import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearTranslationCache,
  readCachedTranslation,
  withTranslationCache,
  writeCachedTranslation,
} from "@/lib/ai/translationCache";
import { TRANSLATION_BATCH_PIECE_LIMIT } from "@/lib/ai/translationRequest";

afterEach(() => {
  clearTranslationCache();
});

describe("withTranslationCache", () => {
  it("skips pieces that already have a translation for the same target", async () => {
    const piece = { html: false, text: "Hola" };
    writeCachedTranslation(piece, "en", "Hello");
    const translateBatch = vi.fn();

    await expect(withTranslationCache([piece], "en", translateBatch)).resolves.toEqual([
      "Hello",
    ]);
    expect(translateBatch).not.toHaveBeenCalled();
    expect(readCachedTranslation(piece, "es")).toBeNull();
  });

  it("keeps successful batches when a later batch fails", async () => {
    const pieces = Array.from({ length: TRANSLATION_BATCH_PIECE_LIMIT + 1 }, (_, index) => ({
      html: false,
      text: `Hola ${index}`,
    }));
    const translateBatch = vi
      .fn()
      .mockResolvedValueOnce(pieces.slice(0, TRANSLATION_BATCH_PIECE_LIMIT).map((piece) => `EN ${piece.text}`))
      .mockRejectedValueOnce(new Error("model failed"));

    await expect(withTranslationCache(pieces, "en", translateBatch)).rejects.toThrow("model failed");
    expect(readCachedTranslation(pieces[0]!, "en")).toBe("EN Hola 0");
    expect(readCachedTranslation(pieces[TRANSLATION_BATCH_PIECE_LIMIT]!, "en")).toBeNull();

    translateBatch.mockResolvedValueOnce([`EN ${pieces[TRANSLATION_BATCH_PIECE_LIMIT]!.text}`]);
    await expect(withTranslationCache(pieces, "en", translateBatch)).resolves.toEqual(
      pieces.map((piece) => `EN ${piece.text}`),
    );
    expect(translateBatch).toHaveBeenCalledTimes(3);
  });
});
