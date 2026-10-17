import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/blog/blogRepository", () => ({
  findPublishedBySlug: vi.fn(),
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
import { findPublishedBySlug } from "@/lib/blog/blogRepository";
import Page, { generateMetadata } from "../page";

const findMock = vi.mocked(findPublishedBySlug);
const params = {
  params: Promise.resolve({ locale: "en", slug: "english-slug" }),
};
const english = {
  id: "post",
  authorId: "owner",
  slug: "english-slug",
  locale: "en",
  availableLocales: ["es", "en"],
  localeSlugs: { es: "slug-espanol", en: "english-slug" },
  title: "English",
  subtitle: null,
  tagline: null,
  content: "<p>English article</p>",
  blocks: undefined,
  faq: null,
  seo: null,
  tags: [],
  travelType: [],
  excuseKey: [],
  level: null,
  label: null,
  format: "ARTICLE",
  source: "TRIPPER",
  coverUrl: "/shared.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
  author: {
    id: "owner",
    name: "Alex",
    tripperSlug: null,
    avatarUrl: null,
    bio: null,
    location: null,
    motto: null,
    specialization: null,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  findMock.mockResolvedValue({ kind: "found", post: english } as never);
});

describe("public blog metadata and structured data", () => {
  it("returns not-found for posts untranslated in the requested locale", async () => {
    findMock.mockResolvedValue({ kind: "not_found" });
    await expect(generateMetadata(params)).rejects.toThrow("NOT_FOUND");
    await expect(Page(params)).rejects.toThrow("NOT_FOUND");
  });

  it("uses the locale's copy and URL in metadata and JSON-LD", async () => {
    const metadata = await generateMetadata(params);
    expect(metadata.title).toBe("English | Randomtrip");
    expect(findMock).toHaveBeenCalledWith("en", "english-slug");
    const page = await Page(params);
    const schema = page.props.children[0].props.schema;
    expect(schema).toMatchObject({ headline: "English", inLanguage: "en" });
    expect(schema.url).toMatch(/\/en\/blog\/english-slug$/);
    expect(schema.mainEntityOfPage["@id"]).toBe(schema.url);
  });

  it("advertises hreflang alternates with each complete locale's own slug", async () => {
    const metadata = await generateMetadata(params);
    expect(metadata.alternates).toEqual({
      canonical: "https://getrandomtrip.com/en/blog/english-slug",
      languages: {
        es: "https://getrandomtrip.com/blog/slug-espanol",
        en: "https://getrandomtrip.com/en/blog/english-slug",
      },
    });
  });

  it("advertises only complete locales", async () => {
    findMock.mockResolvedValue({
      kind: "found",
      post: {
        ...english,
        locale: "es",
        slug: "slug-espanol",
        availableLocales: ["es"],
        localeSlugs: { es: "slug-espanol" },
      },
    } as never);
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "es", slug: "slug-espanol" }),
    });
    expect(metadata.alternates).toEqual({
      canonical: "https://getrandomtrip.com/blog/slug-espanol",
      languages: { es: "https://getrandomtrip.com/blog/slug-espanol" },
    });
  });
});

it("301s retired, wrong-locale and legacy id params to the locale's canonical slug", async () => {
  findMock.mockResolvedValue({ kind: "redirect", slug: "slug-espanol" });
  await expect(
    Page({
      params: Promise.resolve({
        locale: "es",
        slug: "c000000000000000000000000",
      }),
    }),
  ).rejects.toThrow("REDIRECT:/blog/slug-espanol");
  findMock.mockResolvedValue({ kind: "redirect", slug: "english-slug" });
  await expect(
    generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "slug-espanol" }),
    }),
  ).rejects.toThrow("REDIRECT:/en/blog/english-slug");
});
