// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ complete: vi.fn(), edit: vi.fn() }));
vi.mock("../aiService", () => ({ completeJson: m.complete }));
vi.mock("../socialRevision", () => ({ editSocialImage: m.edit }));
import {
  parseTranscreation,
  transcreatePost,
  translateSlideArtwork,
  TRANSCREATION_SYSTEM,
} from "../socialTranscreation";

const valid = {
  caption: "Three steps. Where you're going? That's the surprise.",
  slides: [
    { replacements: [{ from: "¿CÓMO FUNCIONA?", to: "HOW IT WORKS" }] },
    { replacements: [] },
  ],
  notes: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  m.complete.mockResolvedValue(JSON.stringify(valid));
  m.edit.mockResolvedValue(new Uint8Array([9]));
});
afterEach(() => vi.unstubAllEnvs());

it("sends the Spanish caption and every slide to a vision model with the brand rules", async () => {
  const result = await transcreatePost("Tres pasos.", [
    { bytes: new Uint8Array([1]), type: "image/jpeg" },
    { bytes: new Uint8Array([2]), type: "image/jpeg" },
  ]);
  expect(result.caption).toBe(valid.caption);
  const [system, parts, options] = m.complete.mock.calls[0];
  expect(system).toBe(TRANSCREATION_SYSTEM);
  expect(system).toContain("WONDER. WANDER. REPEAT.");
  expect(
    parts.filter((p: { type: string }) => p.type === "image_url"),
  ).toHaveLength(2);
  expect(parts[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
  expect(options.model).toBe("gpt-4.1");
});
it("uses the configured social text model when set", async () => {
  vi.stubEnv("OPENAI_SOCIAL_TEXT_MODEL", "gpt-5");
  await transcreatePost(
    "x",
    [{ bytes: new Uint8Array([1]), type: "image/png" }].concat([
      { bytes: new Uint8Array([2]), type: "image/png" },
    ]),
  );
  expect(m.complete.mock.calls[0][2].model).toBe("gpt-5");
});
it("rejects output without a caption or with the wrong number of slides", () => {
  expect(() =>
    parseTranscreation(JSON.stringify({ ...valid, caption: "" }), 2),
  ).toThrow("AI_TRANSCREATION_INVALID");
  expect(() => parseTranscreation(JSON.stringify(valid), 3)).toThrow(
    "AI_TRANSCREATION_INVALID",
  );
});
it("drops malformed replacements instead of sending them to the image model", () => {
  const parsed = parseTranscreation(
    JSON.stringify({
      ...valid,
      slides: [
        {
          replacements: [
            { from: "A", to: "" },
            { from: 1, to: "B" },
            { from: "C", to: "D" },
          ],
        },
        {},
      ],
    }),
    2,
  );
  expect(parsed.slides[0].replacements).toEqual([{ from: "C", to: "D" }]);
  expect(parsed.slides[1].replacements).toEqual([]);
});
it("edits a slide with only the exact replacements, at high quality", async () => {
  await translateSlideArtwork(
    new Uint8Array([1]),
    "image/jpeg",
    valid.slides[0],
  );
  const [, type, prompt, quality] = m.edit.mock.calls[0];
  expect(type).toBe("image/jpeg");
  expect(prompt).toContain('Replace "¿CÓMO FUNCIONA?" with "HOW IT WORKS"');
  expect(quality).toBe("high");
});
