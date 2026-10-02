import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/analytics-recap/runAnalyticsRecap", () => ({
  runAnalyticsRecap: vi.fn(),
}));
import { runAnalyticsRecap } from "@/lib/analytics-recap/runAnalyticsRecap";
import { POST } from "../route";

const request = (token?: string) =>
  new Request("https://site.test/api/internal/analytics-recap", {
    method: "POST",
    headers: token ? { Authorization: token } : {},
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("CRON_SECRET", "private-token");
  vi.stubEnv(
    "SLACK_ANALYTICS_WEBHOOK_URL",
    "https://hooks.slack.com/services/T000/B000/abc",
  );
  vi.stubEnv("GA4_PROPERTY_ID", "123456789");
  vi.stubEnv("GA4_CLIENT_EMAIL", "svc@proj.iam.gserviceaccount.com");
  vi.stubEnv(
    "GA4_PRIVATE_KEY",
    "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
  );
});
afterEach(() => vi.unstubAllEnvs());

it("is not found outside production", async () => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  expect((await POST(request("Bearer private-token"))).status).toBe(404);
  expect(runAnalyticsRecap).not.toHaveBeenCalled();
});

it.each([undefined, "Bearer wrong", "private-token"])(
  "rejects unauthorized access before processing (%s)",
  async (token) => {
    const response = await POST(request(token));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(runAnalyticsRecap).not.toHaveBeenCalled();
  },
);

it("fails closed when the cron secret is absent", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await POST(request("Bearer private-token"))).status).toBe(401);
  expect(runAnalyticsRecap).not.toHaveBeenCalled();
});

it.each([
  "SLACK_ANALYTICS_WEBHOOK_URL",
  "GA4_PROPERTY_ID",
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY",
])("returns 500 misconfigured when %s is missing", async (name) => {
  vi.stubEnv(name, "");
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "misconfigured" });
  expect(runAnalyticsRecap).not.toHaveBeenCalled();
});

it("sanitizes upstream failures into 503", async () => {
  vi.mocked(runAnalyticsRecap).mockRejectedValue(
    new Error("hooks.slack.com/services/T000/B000/abc"),
  );
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "analytics_unavailable" });
});

it("returns 200 on success and passes validated config", async () => {
  vi.mocked(runAnalyticsRecap).mockResolvedValue(undefined);
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(runAnalyticsRecap).toHaveBeenCalledWith(
    expect.objectContaining({
      webhookUrl: "https://hooks.slack.com/services/T000/B000/abc",
    }),
  );
});
