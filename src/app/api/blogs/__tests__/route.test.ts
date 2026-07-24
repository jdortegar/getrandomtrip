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

  it("filters by travelType/excuseKey using Prisma's { has } array operator, not exact string match", async () => {
    const req = new NextRequest(
      "http://localhost/api/blogs?travelType=solo&excuseKey=solo-adventure",
    );
    await GET(req);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where.travelType).toEqual({ has: "solo" });
    expect(findManyArgs.where.excuseKey).toEqual({ has: "solo-adventure" });
  });

  it("returns travelType/excuseKey as arrays in the response, not scalar-coerced values", async () => {
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "blog-1",
        slug: "my-trip",
        title: "My Trip",
        subtitle: null,
        tagline: null,
        coverUrl: "https://example.com/cover.jpg",
        tags: [],
        format: "ARTICLE",
        publishedAt: new Date("2020-01-01"),
        travelType: ["solo", "couple"],
        excuseKey: ["solo-adventure"],
        author: { id: "tripper-1", name: "Trip A", tripperSlug: "trip-a", avatarUrl: null },
      },
    ]);
    (prisma.blogPost.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const req = new NextRequest("http://localhost/api/blogs");
    const res = await GET(req);
    const body = await res.json();

    expect(body.blogs[0].travelType).toEqual(["solo", "couple"]);
    expect(body.blogs[0].excuseKey).toEqual(["solo-adventure"]);
  });
});
