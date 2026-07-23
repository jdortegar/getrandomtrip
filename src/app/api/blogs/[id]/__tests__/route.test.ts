import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/lib/media/upload-url", () => ({
  normalizeUploadUrl: (url: string | null) => url,
}));

import { GET } from "../route";
import { prisma } from "@/lib/prisma";

describe("GET /api/blogs/[id] (public detail) — visibility guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("excludes review-copy rows and unpublished posts via isReviewCopy: false + isActive: true alongside status: PUBLISHED", async () => {
    const req = new NextRequest("http://localhost/api/blogs/blog-1");
    await GET(req, { params: Promise.resolve({ id: "blog-1" }) });

    const findFirstArgs = (prisma.blogPost.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findFirstArgs.where).toMatchObject({
      status: "PUBLISHED",
      isReviewCopy: false,
      isActive: true,
    });
  });
});
