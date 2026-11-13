import { describe, expect, it } from "vitest";
import { classifyAiReferral } from "../aiReferral";

describe("classifyAiReferral", () => {
  it.each([
    ["https://chatgpt.com/", "chatgpt"],
    ["https://chat.openai.com/c/abc", "chatgpt"],
    ["https://www.perplexity.ai/search?q=viaje", "perplexity"],
    ["https://perplexity.ai/", "perplexity"],
    ["https://gemini.google.com/app", "gemini"],
    ["https://claude.ai/chat/123", "claude"],
    ["https://copilot.microsoft.com/", "copilot"],
  ])("classifies referrer %s as %s", (referrer, source) => {
    expect(classifyAiReferral(referrer, "")).toBe(source);
  });

  it.each([
    ["?utm_source=chatgpt.com", "chatgpt"],
    ["?utm_source=Perplexity", "perplexity"],
    ["?foo=1&utm_source=claude.ai", "claude"],
  ])(
    "classifies landing query %s as %s when there is no referrer",
    (search, source) => {
      expect(classifyAiReferral("", search)).toBe(source);
    },
  );

  it.each([
    ["", ""],
    ["https://www.google.com/", ""],
    ["https://getrandomtrip.com/es/faq", ""],
    ["https://chatgpt.com.evil.example/", ""],
    ["not a url", ""],
    ["", "?utm_source=newsletter"],
  ])("returns null for non-AI traffic (%s %s)", (referrer, search) => {
    expect(classifyAiReferral(referrer, search)).toBeNull();
  });
});
