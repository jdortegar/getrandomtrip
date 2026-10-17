import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/blog/blogRepository", () => ({
  listPublished: vi.fn().mockResolvedValue([]),
}));

import {
  getBlogTeaserPosts,
  getPublishedBlogsForTravelType,
  getRecentPublishedBlogs,
} from "../tripper-queries";
import { listPublished } from "@/lib/blog/blogRepository";

const listMock = vi.mocked(listPublished);

function summary(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    slug: "post-1-slug",
    title: "Post One",
    subtitle: null,
    coverUrl: "/covers/one.jpg",
    tags: ["Aventura"],
    author: {
      id: "tripper-1",
      name: "Alex",
      tripperSlug: "alex",
      avatarUrl: null,
      location: null,
    },
    ...overrides,
  };
}

describe("getRecentPublishedBlogs — public translation reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue([]);
  });

  it("lists across all authors in the locale, requiring a cover at query level so `take` isn't shrunk", async () => {
    await getRecentPublishedBlogs(5);

    expect(listMock).toHaveBeenCalledWith("es", {
      requireCover: true,
      take: 5,
    });
  });

  it("maps translations to cards using the translation's slug", async () => {
    listMock.mockResolvedValue([summary()] as never);

    expect(await getRecentPublishedBlogs(5)).toEqual([
      {
        category: "Aventura",
        href: "/blog/post-1-slug",
        image: "/covers/one.jpg",
        title: "Post One",
      },
    ]);
  });

  it("reads the requested locale and falls back to the locale-appropriate category", async () => {
    listMock.mockResolvedValue([
      summary({ title: "English Three", slug: "english-three", tags: [] }),
    ] as never);

    const resultEn = await getRecentPublishedBlogs(5, "en");
    expect(listMock).toHaveBeenLastCalledWith("en", expect.anything());
    expect(resultEn[0]).toEqual({
      category: "Travel",
      href: "/blog/english-three",
      image: "/covers/one.jpg",
      title: "English Three",
    });

    const resultEs = await getRecentPublishedBlogs(5);
    expect(resultEs[0].category).toBe("Viajes");
  });

  it("returns an empty array on query failure instead of throwing", async () => {
    listMock.mockRejectedValue(new Error("DB error"));

    expect(await getRecentPublishedBlogs(5)).toEqual([]);
  });

  it("loads every published post tagged with a travel type", async () => {
    await getPublishedBlogsForTravelType("group", "es");

    expect(listMock).toHaveBeenCalledWith("es", {
      requireCover: true,
      travelType: "group",
    });
  });

  it("round-robins teaser posts across authors from a wider locale pool", async () => {
    listMock.mockResolvedValue([
      summary({ id: "a1" }),
      summary({ id: "a2" }),
      summary({
        id: "b1",
        author: { ...summary().author, id: "tripper-2" },
      }),
    ] as never);

    const teaser = await getBlogTeaserPosts(2, "en");
    expect(listMock).toHaveBeenCalledWith("en", {
      requireCover: true,
      take: 20,
    });
    expect(teaser.map((post) => post.author.id)).toEqual([
      "tripper-1",
      "tripper-2",
    ]);
  });
});
