// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import handler, { config } from "../../../../netlify/functions/analytics-recap";

const post = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("RT_DEPLOY_ENV", "production");
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

it("runs daily at 09:00 Argentina (12:00 UTC) with a protected POST", async () => {
  const timeout = vi.spyOn(AbortSignal, "timeout");
  expect(config.schedule).toBe("0 12 * * *");
  expect((await handler()).status).toBe(200);
  expect(post).toHaveBeenCalledWith(
    "https://getrandomtrip.com/api/internal/analytics-recap",
    expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer private-token" },
      redirect: "error",
    }),
  );
  expect(timeout).toHaveBeenCalledWith(25_000);
});

it("skips outside production", async () => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  expect((await handler()).status).toBe(204);
  expect(post).not.toHaveBeenCalled();
});

it.each(["", "http://site.test", "https://user:password@site.test"])(
  "rejects invalid site configuration (%s)",
  async (url) => {
    vi.stubEnv("URL", url);
    expect((await handler()).status).toBe(500);
    expect(post).not.toHaveBeenCalled();
  },
);

it("does not dispatch when the cron secret is missing", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await handler()).status).toBe(500);
  expect(post).not.toHaveBeenCalled();
});

it("reports upstream failure without revealing credentials", async () => {
  post.mockRejectedValue(new Error("private-token"));
  const response = await handler();
  expect(response.status).toBe(503);
  expect(await response.text()).toBe("analytics_unavailable");
});

it("reports a non-2xx route response as unavailable", async () => {
  post.mockResolvedValue(new Response("x", { status: 503 }));
  expect((await handler()).status).toBe(503);
});
