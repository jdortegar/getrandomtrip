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
  ).toBeUndefined();
  expect(
    entries.find((entry) => entry.url.endsWith("/blog/translated"))?.alternates
      ?.languages?.en,
  ).toMatch(/\/en\/blog\/translated$/);
});
