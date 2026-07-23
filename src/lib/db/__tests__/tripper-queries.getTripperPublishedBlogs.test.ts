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

  it("excludes review-copy rows and unpublished posts via isReviewCopy: false + isActive: true alongside authorId + status: PUBLISHED", async () => {
    await getTripperPublishedBlogs("tripper-1", 6);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      authorId: "tripper-1",
      status: "PUBLISHED",
      isReviewCopy: false,
      isActive: true,
    });
  });
});
