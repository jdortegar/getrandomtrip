import { afterEach, describe, expect, it, vi } from "vitest";
import { requestCopyTranslation } from "@/lib/ai/requestCopyTranslation";
import { clearTranslationCache } from "@/lib/ai/translationCache";
import { TRANSLATION_BATCH_PIECE_LIMIT } from "@/lib/ai/translationRequest";

afterEach(() => {
  vi.unstubAllGlobals();
  clearTranslationCache();
});

describe("requestCopyTranslation", () => {
  it("posts sequential batches and concatenates the texts", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as {
        pieces: Array<{ text: string }>;
        target: string;
      };
      expect(body.target).toBe("en");
      return Response.json({
        texts: body.pieces.map((piece) => `EN ${piece.text}`),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const pieces = Array.from({ length: TRANSLATION_BATCH_PIECE_LIMIT + 1 }, (_, index) => ({
      html: false,
      text: `Hola ${index}`,
    }));
    await expect(requestCopyTranslation(pieces, "en")).resolves.toEqual(
      pieces.map((piece) => `EN ${piece.text}`),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockClear();
    await expect(requestCopyTranslation(pieces, "en")).resolves.toEqual(
      pieces.map((piece) => `EN ${piece.text}`),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries only the batch that failed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          texts: Array.from({ length: TRANSLATION_BATCH_PIECE_LIMIT }, (_, index) => `EN Hola ${index}`),
        }),
      )
      .mockResolvedValueOnce(Response.json({ error: "Could not translate" }, { status: 502 }))
      .mockResolvedValueOnce(Response.json({ texts: [`EN Hola ${TRANSLATION_BATCH_PIECE_LIMIT}`] }));
    vi.stubGlobal("fetch", fetchMock);

    const pieces = Array.from({ length: TRANSLATION_BATCH_PIECE_LIMIT + 1 }, (_, index) => ({
      html: false,
      text: `Hola ${index}`,
    }));
    await expect(requestCopyTranslation(pieces, "en")).rejects.toThrow("Translation failed");
    await expect(requestCopyTranslation(pieces, "en")).resolves.toEqual(
      pieces.map((piece) => `EN ${piece.text}`),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
