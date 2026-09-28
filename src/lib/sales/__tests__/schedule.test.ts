// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import handler, {
  config,
} from "../../../../netlify/functions/sales-notifications";
const post = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "private-token");
  vi.stubEnv("URL", "https://getrandomtrip.com");
  vi.stubGlobal("fetch", post);
  post.mockResolvedValue(new Response("{}"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("runs every five minutes with protected POST and bounded timeout", async () => {
  const timeout = vi.spyOn(AbortSignal, "timeout");
  expect(config.schedule).toBe("*/5 * * * *");
  expect((await handler()).status).toBe(200);
  expect(post).toHaveBeenCalledWith(
    "https://getrandomtrip.com/api/internal/sales-notifications",
    expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer private-token" },
      redirect: "error",
    }),
  );
  expect(timeout).toHaveBeenCalledWith(25_000);
});
it.each(["", "http://site.test", "https://user:password@site.test"])(
  "rejects invalid site configuration (%s)",
  async (url) => {
    vi.stubEnv("URL", url);
    expect((await handler()).status).toBe(500);
    expect(post).not.toHaveBeenCalled();
  },
);
it("does not dispatch when cron secret is missing", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await handler()).status).toBe(500);
  expect(post).not.toHaveBeenCalled();
});
it("reports upstream failure without revealing credentials", async () => {
  post.mockRejectedValue(new Error("private-token"));
  const response = await handler();
  expect(response.status).toBe(503);
  expect(await response.text()).toBe("sales_unavailable");
});
