// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ announce: vi.fn(), recap: vi.fn() }));
vi.mock("@/lib/deployment", () => ({ isProductionDeployment: () => true }));
vi.mock("@/lib/social-approvals/runSourceCheck", () => ({
  announceNextSourcePost: m.announce,
}));
vi.mock("@/lib/instagram-recap/runInstagramRecap", () => ({
  runInstagramRecap: m.recap,
}));
import { POST } from "@/app/api/internal/instagram-recap/route";

const call = (auth = "Bearer cron") =>
  POST(
    new Request("https://app.test", {
      method: "POST",
      headers: { authorization: auth },
    }),
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "cron");
  vi.stubEnv(
    "SLACK_ANALYTICS_WEBHOOK_URL",
    "https://hooks.slack.com/services/T/B/x",
  );
  vi.stubEnv("INSTAGRAM_PAGE_ACCESS_TOKEN", "EAAG-page-token-value-123");
});
afterEach(() => vi.unstubAllEnvs());

it("announces new Spanish posts in the same run as the recap", async () => {
  expect((await call()).status).toBe(200);
  expect(m.announce).toHaveBeenCalledOnce();
  expect(m.recap).toHaveBeenCalledOnce();
});
it("still announces when the recap fails, and never for unauthorized calls", async () => {
  m.recap.mockRejectedValue(new Error("down"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect((await call()).status).toBe(503);
  expect(m.announce).toHaveBeenCalledOnce();
  m.announce.mockClear();
  expect((await call("Bearer wrong")).status).toBe(401);
  expect(m.announce).not.toHaveBeenCalled();
});
