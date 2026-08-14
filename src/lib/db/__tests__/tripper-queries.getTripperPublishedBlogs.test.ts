import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getTripperPublishedBlogs } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

describe("getTripperPublishedBlogs — visibility guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("excludes review-copy rows, unpublished posts, and cover-less posts via isReviewCopy: false + isActive: true + coverUrl filter, alongside authorId + status: PUBLISHED", async () => {
    await getTripperPublishedBlogs("tripper-1", 6);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      authorId: "tripper-1",
      status: "PUBLISHED",
      isReviewCopy: false,
      isActive: true,
      coverUrl: { not: null },
    });
    expect(findManyArgs.take).toBe(6);
  });

  it("defaults the category fallback to Spanish when no locale is passed", async () => {
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "post-1",
        slug: "post-1-slug",
        title: "Post One",
        subtitle: null,
        coverUrl: "/covers/one.jpg",
        tags: [],
        publishedAt: new Date(),
      },
    ]);

    const result = await getTripperPublishedBlogs("tripper-1", 6);

    expect(result[0].category).toBe("Viajes");
  });

  it("uses the English category fallback when locale is 'en'", async () => {
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "post-1",
        slug: "post-1-slug",
        title: "Post One",
        subtitle: null,
        coverUrl: "/covers/one.jpg",
        tags: [],
        publishedAt: new Date(),
      },
    ]);

    const result = await getTripperPublishedBlogs("tripper-1", 6, "en");

    expect(result[0].category).toBe("Travel");
  });
});
