import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
  },
}));

vi.mock("@/lib/media/upload-url", () => ({
  normalizeUploadUrl: (url: string | null) => url,
}));

import { GET } from "../route";
import { prisma } from "@/lib/prisma";

describe("GET /api/blogs (public list) — visibility guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.blogPost.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  it("excludes review-copy rows and unpublished posts via isReviewCopy: false + isActive: true alongside status: PUBLISHED", async () => {
    const req = new NextRequest("http://localhost/api/blogs");
    await GET(req);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      status: "PUBLISHED",
      isReviewCopy: false,
      isActive: true,
    });
  });
});
