import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/blog/blogRepository", () => ({
  listPublished: vi.fn().mockResolvedValue([]),
}));

import { listPublished } from "@/lib/blog/blogRepository";
import { getPublicXsedBlogDropEntries, getXsedBlogDropsForGrid } from "../xsed";

const listMock = vi.mocked(listPublished);

function summary(id: string, title: string) {
  return {
    id,
    slug: `${id}-slug`,
    title,
    label: "XSED Nº1 (AR)",
    coverUrl: null,
    publishedAt: new Date("2026-03-01"),
    createdAt: new Date("2026-02-01"),
  };
}

describe("XSED blog archive — public translation reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue([]);
  });

  it("lists XSED-level posts complete in the requested locale, newest created first", async () => {
    await getXsedBlogDropsForGrid("en");
    expect(listMock).toHaveBeenCalledWith("en", {
      level: "xsed",
      orderBy: "createdAt",
    });
  });

  it("paginates only locale-public posts and uses each translation's slug", async () => {
    listMock.mockResolvedValue([
      summary("a", "First"),
      summary("b", "Second"),
    ] as never);

    const result = await getPublicXsedBlogDropEntries("en", 0, 1);

    expect(result.hasMore).toBe(true);
    expect(result.drops).toHaveLength(1);
    expect(result.drops[0]).toMatchObject({
      title: "First",
      slug: "a-slug",
      label: "XSED Nº1 (AR)",
      number: 2,
      image: "/images/drops/drops-mendoza.jpg",
    });
  });

  it("treats an unsupported locale as Spanish", async () => {
    await getXsedBlogDropsForGrid("fr");
    expect(listMock.mock.calls[0][0]).toBe("es");
  });
});
