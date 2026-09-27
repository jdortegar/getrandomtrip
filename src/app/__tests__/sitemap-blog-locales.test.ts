vi.mock("@/lib/siteSettings", () => ({
  isGateEnabled: vi.fn(async () => false),
}));
import { expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn(async () => [
        { id: "es", slug: "spanish-only", updatedAt: new Date() },
        {
          id: "both",
          slug: "translated",
          updatedAt: new Date(),
          translations: {
            en: { title: "English", content: "<p>Article</p>", ready: true },
          },
        },
      ]),
    },
    user: { findMany: vi.fn(async () => []) },
  },
}));
vi.mock("@/lib/db/tripper-queries", () => ({
  getAllTrippers: vi.fn(async () => []),
}));
import sitemap from "../sitemap";
it("does not advertise English alternates for untranslated posts", async () => {
  const entries = await sitemap();
  expect(
    entries.find((entry) => entry.url.endsWith("/blog/spanish-only"))
      ?.alternates,
  ).toEqual({
    languages: { es: "https://getrandomtrip.com/blog/spanish-only" },
  });
  expect(
    entries.find((entry) => entry.url.endsWith("/blog/translated"))?.alternates
      ?.languages?.en,
  ).toMatch(/\/en\/blog\/translated$/);
});

it("emits both locales with reciprocal alternates and no redirected Spanish URLs", async () => {
  const entries = await sitemap();
  expect(entries.some((entry) => entry.url.includes("/es/"))).toBe(false);
  expect(
    entries.some((entry) => entry.url.endsWith("/en/blog/spanish-only")),
  ).toBe(false);
  for (const entry of entries.filter((entry) =>
    entry.url.endsWith("/blog/translated"),
  )) {
    expect(entry.alternates?.languages).toEqual({
      es: "https://getrandomtrip.com/blog/translated",
      en: "https://getrandomtrip.com/en/blog/translated",
    });
  }
  expect(
    entries.filter((entry) => entry.url.endsWith("/blog/translated")),
  ).toHaveLength(2);
});

it("advertises no hidden pages when the launch gate is reenabled", async () => {
  const { isGateEnabled } = await import("@/lib/siteSettings");
  vi.mocked(isGateEnabled).mockResolvedValueOnce(true);
  expect(await sitemap()).toEqual([]);
});
