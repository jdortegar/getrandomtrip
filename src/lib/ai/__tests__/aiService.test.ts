import { afterEach, describe, expect, it, vi } from "vitest";
import { aiService, AiServiceError } from "@/lib/ai/aiService";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENAI_API_KEY;
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
      model: "gpt-4.1-nano",
      response_format: { type: "json_object" },
    });
    expect(request.headers).toMatchObject({ Authorization: "Bearer test-key" });
  });
});
