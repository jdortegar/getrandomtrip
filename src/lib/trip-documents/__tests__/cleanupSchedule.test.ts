import { afterEach, beforeEach, expect, it, vi } from "vitest";
import handler, {
  config,
} from "../../../../netlify/functions/document-cleanup";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("URL", "https://site.test");
  vi.stubEnv("CRON_SECRET", "token");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("invokes authenticated internal cleanup hourly with a bounded fetch", async () => {
  fetchMock.mockResolvedValue(
    new Response("{private details}", { status: 200 }),
  );
  expect(config.schedule).toBe("0 * * * *");
  const response = await handler();
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("ok");
  expect(fetchMock).toHaveBeenCalledWith(
    "https://site.test/api/internal/document-cleanup",
    expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer token" },
      redirect: "error",
      signal: expect.any(AbortSignal),
    }),
  );
});
it("does not dispatch without credentials", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await handler()).status).toBe(500);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("does not forward secrets to unsafe configured origins", async () => {
  vi.stubEnv("URL", "http://site.test");
  expect((await handler()).status).toBe(500);
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each(["http", "timeout"])("returns safe failure for %s", async (mode) => {
  if (mode === "http")
    fetchMock.mockResolvedValue(
      new Response("private details", { status: 503 }),
    );
  else fetchMock.mockRejectedValue(new Error("secret provider details"));
  const response = await handler();
  expect(response.status).toBe(503);
  expect(await response.text()).toBe("cleanup_unavailable");
});
