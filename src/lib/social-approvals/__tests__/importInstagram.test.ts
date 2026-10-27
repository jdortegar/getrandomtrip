// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ profile: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/instagram-recap/instagramClient", () => ({
  getProfile: m.profile,
}));
vi.mock("../sourceMedia", () => ({ listSourceMedia: m.list }));
import {
  instagramImportUrl,
  resolveOwnedInstagramPost,
} from "../importInstagram";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SOCIAL_TARGET_PAGE_TOKEN", "x".repeat(30));
  m.profile.mockResolvedValue({
    userId: "owned",
    username: "getrandomtrip.en",
  });
  m.list.mockResolvedValue([
    {
      id: "123",
      permalink: "https://www.instagram.com/p/De0IMw8jOGl/",
      mediaType: "IMAGE",
    },
  ]);
});
afterEach(() => vi.unstubAllEnvs());
it("canonicalizes locally and rejects deceptive hosts, redirects, credentials and non-post paths", () => {
  expect(
    instagramImportUrl("https://instagram.com/p/De0IMw8jOGl/?igsh=abc")
      .permalink,
  ).toBe("https://www.instagram.com/p/De0IMw8jOGl/");
  for (const url of [
    "https://instagram.com.attacker.test/p/De0IMw8jOGl/",
    "https://attacker.test/?url=https://instagram.com/p/De0IMw8jOGl/",
    "https://user@instagram.com/p/De0IMw8jOGl/",
    "http://instagram.com/p/De0IMw8jOGl/",
    "https://instagram.com/reel/De0IMw8jOGl/",
    "https://instagram.com:8443/p/De0IMw8jOGl/",
  ])
    expect(() => instagramImportUrl(url)).toThrow();
});
it("resolves only exact matching permalinks from the configured owned EN feed", async () => {
  expect(
    await resolveOwnedInstagramPost("https://instagram.com/p/De0IMw8jOGl/"),
  ).toMatchObject({ id: "123", accountUsername: "getrandomtrip.en" });
  expect(m.list).toHaveBeenCalledWith("x".repeat(30), "owned");
  await expect(
    resolveOwnedInstagramPost("https://instagram.com/p/OTHER123/"),
  ).rejects.toThrow("POST_NOT_IN_OWNED_FEED");
});
it("fails closed without credentials, on different account or unsupported media", async () => {
  vi.stubEnv("SOCIAL_TARGET_PAGE_TOKEN", "");
  await expect(
    resolveOwnedInstagramPost("https://instagram.com/p/De0IMw8jOGl/"),
  ).rejects.toThrow("IMPORT_ACCOUNT_UNCONFIGURED");
  vi.stubEnv("SOCIAL_TARGET_PAGE_TOKEN", "x".repeat(30));
  m.profile.mockResolvedValue({ userId: "id", username: "getrandomtrip.es" });
  await expect(
    resolveOwnedInstagramPost("https://instagram.com/p/De0IMw8jOGl/"),
  ).rejects.toThrow("IMPORT_ACCOUNT_MISMATCH");
  m.profile.mockResolvedValue({ userId: "id", username: "getrandomtrip.en" });
  m.list.mockResolvedValue([
    {
      id: "123",
      permalink: "https://www.instagram.com/p/De0IMw8jOGl/",
      mediaType: "VIDEO",
    },
  ]);
  await expect(
    resolveOwnedInstagramPost("https://instagram.com/p/De0IMw8jOGl/"),
  ).rejects.toThrow("IMPORT_SINGLE_IMAGE_ONLY");
});
