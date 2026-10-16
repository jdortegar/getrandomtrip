import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/blog/blogRepository", () => ({
  findPublishedBySlug: vi.fn().mockResolvedValue({ kind: "not_found" }),
}));

vi.mock("@/lib/media/upload-url", () => ({
  normalizeUploadUrl: (url: string | null) => url,
}));

import { GET } from "../route";
import { findPublishedBySlug } from "@/lib/blog/blogRepository";

const findMock = vi.mocked(findPublishedBySlug);
const date = new Date("2020-01-01");
const post = {
  id: "blog-1",
  authorId: "tripper-1",
  slug: "trip",
  locale: "en",
  availableLocales: ["es", "en"],
  localeSlugs: { es: "viaje", en: "trip" },
  title: "Trip",
  subtitle: null,
  tagline: null,
  content: "<p>Body</p>",
  blocks: undefined,
  faq: null,
  seo: null,
  coverUrl: "/cover.jpg",
  tags: [],
  travelType: [],
  excuseKey: [],
  level: null,
  label: null,
  format: "ARTICLE",
  source: "TRIPPER",
  publishedAt: date,
  createdAt: date,
  updatedAt: date,
  author: {
    id: "tripper-1",
    name: "Alex",
    tripperSlug: "alex",
    avatarUrl: null,
    bio: null,
    location: null,
    motto: null,
    specialization: null,
  },
};

function get(path: string, id: string) {
  return GET(new NextRequest(`http://localhost${path}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/blogs/[id] (public detail)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMock.mockResolvedValue({ kind: "not_found" });
  });

  it("404s when the post is not public in the requested locale", async () => {
    const res = await get("/api/blogs/viaje?locale=en", "viaje");
    expect(res.status).toBe(404);
    expect(findMock).toHaveBeenCalledWith("en", "viaje");
  });

  it("follows a slug redirect once and returns the canonical translation", async () => {
    findMock
      .mockResolvedValueOnce({ kind: "redirect", slug: "trip" })
      .mockResolvedValueOnce({ kind: "found", post } as never);
    const res = await get("/api/blogs/viaje?locale=en", "viaje");
    expect(findMock).toHaveBeenLastCalledWith("en", "trip");
    const { blog } = await res.json();
    expect(blog).toMatchObject({
      id: "blog-1",
      slug: "trip",
      title: "Trip",
      subtitle: "",
      content: "<p>Body</p>",
      faq: null,
      seo: null,
      format: "article",
      author: { name: "Alex", slug: "alex", bio: "" },
    });
  });
});
