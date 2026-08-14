import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getRecentPublishedBlogs } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

describe("getRecentPublishedBlogs — visibility guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("queries across all authors (no authorId filter) with status: PUBLISHED, isReviewCopy: false, isActive: true", async () => {
    await getRecentPublishedBlogs(5);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyArgs.where).not.toHaveProperty("authorId");
    expect(findManyArgs.where).toMatchObject({
      status: "PUBLISHED",
      isReviewCopy: false,
      isActive: true,
    });
    expect(findManyArgs.orderBy).toEqual({ publishedAt: "desc" });
    expect(findManyArgs.take).toBe(5);
  });

  it("filters out posts without a coverUrl and maps to BlogPost shape", async () => {
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "post-1",
        slug: "post-1-slug",
        title: "Post One",
        subtitle: null,
        coverUrl: "/covers/one.jpg",
        tags: ["Aventura"],
        publishedAt: new Date(),
      },
      {
        id: "post-2",
        slug: null,
        title: "Post Two",
        subtitle: null,
        coverUrl: null,
        tags: [],
        publishedAt: new Date(),
      },
    ]);

    const result = await getRecentPublishedBlogs(5);

    expect(result).toEqual([
      {
        category: "Aventura",
        href: "/blog/post-1-slug",
        image: "/covers/one.jpg",
        title: "Post One",
      },
    ]);
  });

  it("falls back to 'Viajes' category and post id when tags/slug are missing", async () => {
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "post-3",
        slug: null,
        title: "Post Three",
        subtitle: null,
        coverUrl: "/covers/three.jpg",
        tags: [],
        publishedAt: new Date(),
      },
    ]);

    const result = await getRecentPublishedBlogs(5);

    expect(result).toEqual([
      {
        category: "Viajes",
        href: "/blog/post-3",
        image: "/covers/three.jpg",
        title: "Post Three",
      },
    ]);
  });

  it("returns an empty array on query failure instead of throwing", async () => {
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );

    const result = await getRecentPublishedBlogs(5);

    expect(result).toEqual([]);
  });
});
