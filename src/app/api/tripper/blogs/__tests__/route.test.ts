import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    blogPost: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null), // no slug conflict
      create: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../route";

const mockSession = (userId: string) => ({ user: { id: userId, email: "tripper@example.com" } });
const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });

describe("GET /api/tripper/blogs (own list) — visibility guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.blogPost.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  it("excludes the tripper's own review-copy rows via isReviewCopy: false alongside authorId", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const res = await GET(new NextRequest("http://localhost/api/tripper/blogs"));
    expect(res.status).toBe(200);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      authorId: "tripper-1",
      isReviewCopy: false,
    });
  });

  it("paginates with page/limit and returns total", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.blogPost.count as ReturnType<typeof vi.fn>).mockResolvedValue(37);

    const res = await GET(
      new NextRequest("http://localhost/api/tripper/blogs?page=2&limit=10"),
    );
    const body = await res.json();

    expect(body.total).toBe(37);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.skip).toBe(10);
    expect(findManyArgs.take).toBe(10);
  });

  it("applies status, format, travelType, and search filters to the where clause", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    await GET(
      new NextRequest(
        "http://localhost/api/tripper/blogs?status=draft&format=video&travelType=solo&search=patagonia",
      ),
    );

    const findManyArgs = (prisma.blogPost.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyArgs.where).toMatchObject({
      authorId: "tripper-1",
      isReviewCopy: false,
      status: "DRAFT",
      format: "VIDEO",
      travelType: { has: "solo" },
      title: { contains: "patagonia", mode: "insensitive" },
    });
  });
});

describe("POST /api/tripper/blogs (create) — status is never accepted from the client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.blogPost.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.blogPost.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "blog-1",
      authorId: "tripper-1",
      title: "My Trip",
      status: "DRAFT",
      format: "ARTICLE",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
    });
  });

  it("ignores a client-sent status: 'published' — every new post is created DRAFT regardless", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const req = new NextRequest("http://localhost/api/tripper/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Trip", status: "published" }),
    });
    await POST(req);

    const createArgs = (prisma.blogPost.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createArgs.data.status).toBeUndefined();
    expect(createArgs.data.publishedAt).toBeUndefined();
  });

  it("normalizes travelType/excuseKey — dedupes, trims, and drops non-strings/empty entries", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const req = new NextRequest("http://localhost/api/tripper/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Trip",
        travelType: ["solo", "solo", "  couple  ", 123, ""],
        excuseKey: ["solo", "solo", "  couple  ", 123, ""],
      }),
    });
    await POST(req);

    const createArgs = (prisma.blogPost.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createArgs.data.travelType).toEqual(["solo", "couple"]);
    expect(createArgs.data.excuseKey).toEqual(["solo", "couple"]);
  });

  it("defaults travelType/excuseKey to [] when omitted or not an array", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const req = new NextRequest("http://localhost/api/tripper/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Trip", travelType: "solo", excuseKey: null }),
    });
    await POST(req);

    const createArgs = (prisma.blogPost.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createArgs.data.travelType).toEqual([]);
    expect(createArgs.data.excuseKey).toEqual([]);
  });

  it("defaults travelType/excuseKey to [] when the fields are omitted entirely", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const req = new NextRequest("http://localhost/api/tripper/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Trip" }),
    });
    await POST(req);

    const createArgs = (prisma.blogPost.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createArgs.data.travelType).toEqual([]);
    expect(createArgs.data.excuseKey).toEqual([]);
  });
});
