import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/blog/blogRepository", () => ({
  listPublished: vi.fn().mockResolvedValue([]),
}));

import { getTripperPublishedBlogs } from "../tripper-queries";
import { listPublished } from "@/lib/blog/blogRepository";

const listMock = vi.mocked(listPublished);
const post = {
  id: "post-1",
  slug: "post-1-slug",
  title: "Post One",
  subtitle: null,
  coverUrl: "/covers/one.jpg",
  tags: [],
};

describe("getTripperPublishedBlogs — public translation reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue([]);
  });

  it("scopes the public list to the tripper and requires a cover", async () => {
    await getTripperPublishedBlogs("tripper-1", 6);

    expect(listMock).toHaveBeenCalledWith("es", {
      authorId: "tripper-1",
      requireCover: true,
      take: 6,
    });
  });

  it("defaults the category fallback to Spanish when no locale is passed", async () => {
    listMock.mockResolvedValue([post] as never);

    const result = await getTripperPublishedBlogs("tripper-1", 6);

    expect(result[0].category).toBe("Viajes");
  });

  it("reads English translations and uses the English category fallback", async () => {
    listMock.mockResolvedValue([{ ...post, title: "English One" }] as never);

    const result = await getTripperPublishedBlogs("tripper-1", 6, "en");

    expect(listMock.mock.calls[0][0]).toBe("en");
    expect(result[0]).toMatchObject({ category: "Travel", title: "English One" });
  });
});
