vi.mock("@/lib/siteSettings", () => ({
  isGateEnabled: vi.fn(async () => false),
}));
import { expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn(async () => []) },
  },
}));
vi.mock("@/lib/blog/blogRepository", () => ({
  findPublishedBySlug: vi.fn(async (_locale: string, slug: string) =>
    slug === "trekking-en-grupo"
      ? { kind: "redirect", slug: "trekking-en-grupo-tips-y-risas" }
      : { kind: "not_found" },
  ),
  listPublishedLocaleSlugs: vi.fn(async () => [
    { id: "es", updatedAt: new Date(), localeSlugs: { es: "spanish-only" } },
    {
      id: "both",
      updatedAt: new Date(),
      localeSlugs: { es: "traducido", en: "translated" },
    },
  ]),
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
    entries.some((entry) => entry.url.endsWith("/en/blog/spanish-only")),
  ).toBe(false);
});

it("emits one entry per complete translation with its own slug and reciprocal alternates", async () => {
  const entries = await sitemap();
  expect(entries.some((entry) => entry.url.includes("/es/"))).toBe(false);
  const translated = entries.filter(
    (entry) =>
      entry.url.endsWith("/blog/traducido") ||
      entry.url.endsWith("/en/blog/translated"),
  );
  expect(translated.map((entry) => entry.url)).toEqual([
    "https://getrandomtrip.com/blog/traducido",
    "https://getrandomtrip.com/en/blog/translated",
  ]);
  for (const entry of translated) {
    expect(entry.alternates?.languages).toEqual({
      es: "https://getrandomtrip.com/blog/traducido",
      en: "https://getrandomtrip.com/en/blog/translated",
    });
  }
});

it("skips traveler story slugs a published post already claims", async () => {
  const urls = (await sitemap()).map((entry) => entry.url);
  expect(urls.some((url) => url.endsWith("/blog/trekking-en-grupo"))).toBe(
    false,
  );
  expect(urls).toContain(
    "https://getrandomtrip.com/blog/viajar-solo-la-mejor-decision",
  );
  expect(urls).toContain(
    "https://getrandomtrip.com/en/blog/viajar-solo-la-mejor-decision",
  );
});

it("advertises no hidden pages when the launch gate is reenabled", async () => {
  const { isGateEnabled } = await import("@/lib/siteSettings");
  vi.mocked(isGateEnabled).mockResolvedValueOnce(true);
  expect(await sitemap()).toEqual([]);
});
