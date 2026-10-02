import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readAnalyticsRecapConfig } from "../readAnalyticsRecapConfig";

const HOOK = "https://hooks.slack.com/services/T000/B000/abcDEF123";
beforeEach(() => {
  vi.stubEnv("SLACK_ANALYTICS_WEBHOOK_URL", HOOK);
  vi.stubEnv("GA4_PROPERTY_ID", "123456789");
  vi.stubEnv("GA4_CLIENT_EMAIL", "svc@proj.iam.gserviceaccount.com");
  vi.stubEnv(
    "GA4_PRIVATE_KEY",
    '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"',
  );
});
afterEach(() => vi.unstubAllEnvs());

it("returns validated config with an unescaped key", () => {
  const config = readAnalyticsRecapConfig();
  expect(config?.webhookUrl).toBe(HOOK);
  expect(config?.ga4.propertyId).toBe("123456789");
  expect(config?.ga4.privateKey).toContain("-----BEGIN PRIVATE KEY-----\nabc");
});

it.each([
  "SLACK_ANALYTICS_WEBHOOK_URL",
  "GA4_PROPERTY_ID",
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY",
])("returns null when %s is missing", (name) => {
  vi.stubEnv(name, " ");
  expect(readAnalyticsRecapConfig()).toBeNull();
});

it.each([
  "http://hooks.slack.com/services/T/B/x",
  "https://evil.test/services/T/B/x",
  "https://hooks.slack.com/other",
  "https://user:pw@hooks.slack.com/services/T/B/x",
  "not a url",
])("rejects invalid webhook %s", (url) => {
  vi.stubEnv("SLACK_ANALYTICS_WEBHOOK_URL", url);
  expect(readAnalyticsRecapConfig()).toBeNull();
});

it("rejects a non-numeric property id", () => {
  vi.stubEnv("GA4_PROPERTY_ID", "../x");
  expect(readAnalyticsRecapConfig()).toBeNull();
});
