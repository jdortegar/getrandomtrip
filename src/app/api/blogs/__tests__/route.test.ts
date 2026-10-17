import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/blog/blogRepository", () => ({
  listPublished: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/media/upload-url", () => ({
  normalizeUploadUrl: (url: string | null) => url,
}));

import { GET } from "../route";
import { listPublished } from "@/lib/blog/blogRepository";

const listMock = vi.mocked(listPublished);

function summary(overrides: Record<string, unknown> = {}) {
  return {
    id: "blog-1",
    authorId: "tripper-1",
    slug: "my-trip",
    locale: "es",
    availableLocales: ["es"],
    localeSlugs: { es: "my-trip" },
    title: "My Trip",
    subtitle: null,
    tagline: null,
    coverUrl: "https://example.com/cover.jpg",
    tags: [],
    format: "ARTICLE",
    source: "TRIPPER",
    level: null,
    label: null,
    publishedAt: new Date("2020-01-01"),
    createdAt: new Date("2020-01-01"),
    updatedAt: new Date("2020-01-01"),
    travelType: ["solo", "couple"],
    excuseKey: ["solo-adventure"],
    author: {
      id: "tripper-1",
      name: "Trip A",
      tripperSlug: "trip-a",
      avatarUrl: null,
      bio: null,
      location: null,
      motto: null,
      specialization: null,
    },
    ...overrides,
  };
}

describe("GET /api/blogs (public list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue([]);
  });

  it("lists through the translation repository in the requested locale (Spanish by default)", async () => {
    await GET(new NextRequest("http://localhost/api/blogs?locale=en"));
    expect(listMock.mock.calls[0][0]).toBe("en");

    await GET(new NextRequest("http://localhost/api/blogs"));
    expect(listMock.mock.calls[1][0]).toBe("es");
  });

  it("forwards travelType/excuseKey and tripper filters", async () => {
    await GET(
      new NextRequest(
        "http://localhost/api/blogs?travelType=solo&excuseKey=solo-adventure&tripperIds=a,%20b",
      ),
    );
    expect(listMock.mock.calls[0][1]).toMatchObject({
      travelType: "solo",
      excuseKey: "solo-adventure",
      authorId: ["a", "b"],
    });
  });

  it("filters by a valid level, combinable with travelType", async () => {
    await GET(new NextRequest("http://localhost/api/blogs?level=xsed&travelType=solo"));
    expect(listMock.mock.calls[0][1]).toMatchObject({
      level: "xsed",
      travelType: "solo",
    });
  });

  it("ignores an invalid level value instead of filtering by it", async () => {
    await GET(new NextRequest("http://localhost/api/blogs?level=not-a-real-level"));
    expect(listMock.mock.calls[0][1]?.level).toBeUndefined();
  });

  it("paginates after filtering so totals only count posts public in this locale", async () => {
    listMock.mockResolvedValue([
      summary(),
      summary({ id: "blog-2", slug: "second", authorId: "tripper-2" }),
    ] as never);
    const res = await GET(new NextRequest("http://localhost/api/blogs?limit=1"));
    const body = await res.json();
    expect(body.blogs).toHaveLength(1);
    expect(body.pagination).toMatchObject({ total: 2, hasMore: true, totalPages: 2 });
  });

  it("keeps the public response shape, with the translation's slug and arrays intact", async () => {
    listMock.mockResolvedValue([summary()] as never);
    const res = await GET(new NextRequest("http://localhost/api/blogs"));
    const body = await res.json();

    expect(body.blogs[0]).toEqual({
      author: {
        avatarUrl: "",
        id: "tripper-1",
        name: "Trip A",
        slug: "trip-a",
      },
      coverUrl: "https://example.com/cover.jpg",
      excuseKey: ["solo-adventure"],
      format: "article",
      id: "blog-1",
      publishedAt: "2020-01-01T00:00:00.000Z",
      slug: "my-trip",
      subtitle: "",
      tagline: "",
      tags: [],
      title: "My Trip",
      travelType: ["solo", "couple"],
    });
  });
});
