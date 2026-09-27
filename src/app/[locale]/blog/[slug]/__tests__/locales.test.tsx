import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: { blogPost: { findFirst: vi.fn() } },
}));
vi.mock("next/navigation", () => ({
  permanentRedirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/components/app/blog/BlogPostClient", () => ({
  default: () => null,
  BlogPostLoading: () => null,
}));
import { prisma } from "@/lib/prisma";
import Page, { generateMetadata } from "../page";
const params = {
  params: Promise.resolve({ locale: "en", slug: "shared-slug" }),
};
const base = {
  id: "post",
  slug: "shared-slug",
  title: "Español",
  subtitle: "Descripción española",
  content: "<p>Español</p>",
  seo: { title: "SEO español", description: "SEO en español" },
  blocks: [],
  tags: [],
  format: "ARTICLE",
  source: "TRIPPER",
  coverUrl: "/shared.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
  author: { id: "owner", name: "Alex" },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.blogPost.findFirst).mockResolvedValue(base as never);
});
describe("public blog metadata and structured data", () => {
  it("returns not-found for untranslated English metadata and pages", async () => {
    await expect(generateMetadata(params)).rejects.toThrow("NOT_FOUND");
    await expect(Page(params)).rejects.toThrow("NOT_FOUND");
  });
  it("uses English copy and locale URL in metadata and JSON-LD without Spanish SEO fallback", async () => {
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue({
      ...base,
      translations: {
        en: {
          title: "English",
          content: "<p>English article</p>",
          ready: true,
        },
      },
    } as never);
    const metadata = await generateMetadata(params);
    expect(metadata.title).toBe("English | Randomtrip");
    expect(JSON.stringify(metadata)).not.toContain("español");
    const page = await Page(params);
    const schema = page.props.children[0].props.schema;
    expect(schema).toMatchObject({ headline: "English", inLanguage: "en" });
    expect(schema.url).toMatch(/\/en\/blog\/shared-slug$/);
    expect(schema.mainEntityOfPage["@id"]).toBe(schema.url);
    expect(JSON.stringify(schema)).not.toContain("español");
  });
});

it("consolidates legacy article IDs onto the locale-aware slug", async () => {
  await expect(
    Page({
      params: Promise.resolve({
        locale: "es",
        slug: "c000000000000000000000000",
      }),
    }),
  ).rejects.toThrow("REDIRECT:/blog/shared-slug");
  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "es", slug: "shared-slug" }),
  });
  expect(metadata.alternates).toEqual({
    canonical: "https://getrandomtrip.com/blog/shared-slug",
    languages: { es: "https://getrandomtrip.com/blog/shared-slug" },
  });
});
