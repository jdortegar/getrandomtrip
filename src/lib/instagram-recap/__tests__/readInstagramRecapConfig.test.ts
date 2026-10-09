import { afterEach, expect, it, vi } from "vitest";
import { readInstagramRecapConfig } from "../readInstagramRecapConfig";

const HOOK = "https://hooks.slack.com/services/T000/B000/abc123";
const TOKEN = "EAAJx1example_page_token-value";
afterEach(() => vi.unstubAllEnvs());

it("reads a valid config and strips quotes", () => {
  vi.stubEnv("SLACK_ANALYTICS_WEBHOOK_URL", HOOK);
  vi.stubEnv("INSTAGRAM_PAGE_ACCESS_TOKEN", `"${TOKEN}"`);
  expect(readInstagramRecapConfig()).toEqual({
    webhookUrl: HOOK,
    pageToken: TOKEN,
  });
});

it("rejects a missing token or a non-Slack webhook", () => {
  vi.stubEnv("SLACK_ANALYTICS_WEBHOOK_URL", HOOK);
  vi.stubEnv("INSTAGRAM_PAGE_ACCESS_TOKEN", "");
  expect(readInstagramRecapConfig()).toBeNull();
  vi.stubEnv("INSTAGRAM_PAGE_ACCESS_TOKEN", TOKEN);
  vi.stubEnv(
    "SLACK_ANALYTICS_WEBHOOK_URL",
    "https://evil.example/services/a/b/c",
  );
  expect(readInstagramRecapConfig()).toBeNull();
});
