// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("@/lib/upload/mediaStores", () => ({
  getMediaWriteStore: () => store,
}));
import { loadSocialArtwork, saveSocialArtwork } from "../socialAssets";
import { socialWorkerAuthorized } from "../dispatchSocialWorker";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it("rejects foreign asset origins before fetching and follows no redirects", async () => {
  vi.stubEnv("SLACK_SOCIAL_IMAGE_ORIGIN", "https://app.test");
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(new Uint8Array([1, 2]), {
        headers: { "Content-Type": "image/png" },
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    loadSocialArtwork("https://attacker.test/image.png"),
  ).rejects.toThrow("UNTRUSTED_ASSET");
  expect(fetcher).not.toHaveBeenCalled();
  expect((await loadSocialArtwork("https://app.test/image.png")).type).toBe(
    "image/png",
  );
  expect(fetcher).toHaveBeenCalledWith(
    expect.any(URL),
    expect.objectContaining({ redirect: "error" }),
  );
});
it("writes immutable job-specific media without overwriting and requires app/asset origin alignment", async () => {
  vi.stubEnv("SLACK_SOCIAL_IMAGE_ORIGIN", "https://app.test");
  vi.stubEnv("SLACK_SOCIAL_APP_ORIGIN", "https://app.test");
  const url = await saveSocialArtwork("job-123", new Uint8Array([1]));
  expect(url).toContain("https://app.test/api/upload?key=");
  expect(store.set).toHaveBeenCalledWith(
    expect.stringContaining("job-123.png"),
    expect.any(ArrayBuffer),
    expect.objectContaining({ onlyIfNew: true }),
  );
  vi.stubEnv("SLACK_SOCIAL_APP_ORIGIN", "https://other.test");
  await expect(saveSocialArtwork("job", new Uint8Array([1]))).rejects.toThrow(
    "ASSET_ORIGIN_UNCONFIGURED",
  );
});
it("background worker is fail-closed without a matching independent secret", () => {
  vi.stubEnv("SLACK_SOCIAL_WORKER_SECRET", "");
  expect(socialWorkerAuthorized(new Request("https://app.test"))).toBe(false);
  vi.stubEnv("SLACK_SOCIAL_WORKER_SECRET", "worker-secret");
  expect(
    socialWorkerAuthorized(
      new Request("https://app.test", {
        headers: { Authorization: "Bearer worker-secret" },
      }),
    ),
  ).toBe(true);
  expect(
    socialWorkerAuthorized(
      new Request("https://app.test", {
        headers: { Authorization: "Bearer wrong" },
      }),
    ),
  ).toBe(false);
});
