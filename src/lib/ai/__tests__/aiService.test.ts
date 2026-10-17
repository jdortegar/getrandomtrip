import { afterEach, describe, expect, it, vi } from "vitest";
import { aiService, AiServiceError } from "@/lib/ai/aiService";
import { clearTranslationCache } from "@/lib/ai/translationCache";
import { TRANSLATION_BATCH_PIECE_LIMIT } from "@/lib/ai/translationRequest";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENAI_API_KEY;
  clearTranslationCache();
});

describe("aiService.translate", () => {
  it("fails closed when the API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(aiService.translate([{ html: false, text: "Hola" }], "en")).rejects.toBeInstanceOf(
      AiServiceError,
    );
  });

  it("sends the pieces to the small model and keeps the original when a translation is blank", async () => {
    delete process.env.OPENAI_TRANSLATION_MODEL;
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      Response.json({
        choices: [{ message: { content: JSON.stringify({ texts: ["Hello", "   "] }) } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      aiService.translate(
        [
          { html: false, text: "Hola" },
          { html: true, text: "<p>Lago</p>" },
        ],
        "en",
      ),
    ).resolves.toEqual(["Hello", "<p>Lago</p>"]);

    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(JSON.parse(String(request.body))).toMatchObject({
      max_completion_tokens: 16384,
      model: "gpt-4.1-nano",
      response_format: { type: "json_object" },
    });
    expect(request.headers).toMatchObject({ Authorization: "Bearer test-key" });
  });

  it("sends oversized copy in sequential batches", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as {
        messages: Array<{ content: string }>;
      };
      const user = JSON.parse(body.messages[1]?.content ?? "{}") as {
        pieces: Array<{ text: string }>;
      };
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                texts: user.pieces.map((piece) => `EN ${piece.text}`),
              }),
            },
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const pieces = Array.from({ length: TRANSLATION_BATCH_PIECE_LIMIT + 1 }, (_, index) => ({
      html: false,
      text: `Hola ${index}`,
    }));
    await expect(aiService.translate(pieces, "en")).resolves.toEqual(
      pieces.map((piece) => `EN ${piece.text}`),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to one piece at a time when the model drops an entry", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as {
        messages: Array<{ content: string }>;
      };
      const user = JSON.parse(body.messages[1]?.content ?? "{}") as {
        pieces: Array<{ text: string }>;
      };
      const texts =
        user.pieces.length === 1
          ? [`EN ${user.pieces[0]?.text}`]
          : user.pieces.slice(1).map((piece) => `EN ${piece.text}`);
      return Response.json({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ texts }) } }],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const pieces = [
      { html: false, text: "Uno" },
      { html: false, text: "Dos" },
      { html: true, text: "<p>Tres</p>" },
    ];
    await expect(aiService.translate(pieces, "en")).resolves.toEqual([
      "EN Uno",
      "EN Dos",
      "EN <p>Tres</p>",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
