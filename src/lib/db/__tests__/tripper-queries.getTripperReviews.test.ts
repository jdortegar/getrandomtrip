import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
  },
}));

import { getTripperReviews, getTripperReviewStats } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const findManyMock = prisma.review.findMany as ReturnType<typeof vi.fn>;
const countMock = prisma.review.count as ReturnType<typeof vi.fn>;

describe("getTripperReviews — status filter + search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
  });

  it("defaults to no isApproved filter (status: 'all') when status is omitted", async () => {
    await getTripperReviews("tripper-1", { page: 1, limit: 20 });

    const where = findManyMock.mock.calls[0][0].where;
    expect(where.tripperId).toBe("tripper-1");
    expect("isApproved" in where).toBe(false);
  });

  it("filters isApproved: true when status is 'approved'", async () => {
    await getTripperReviews("tripper-1", { page: 1, limit: 20, status: "approved" });

    const where = findManyMock.mock.calls[0][0].where;
    expect(where.isApproved).toBe(true);
  });

  it("filters isApproved: false when status is 'unapproved'", async () => {
    await getTripperReviews("tripper-1", { page: 1, limit: 20, status: "unapproved" });

    const where = findManyMock.mock.calls[0][0].where;
    expect(where.isApproved).toBe(false);
  });

  it("adds a case-insensitive user.name filter when search is provided", async () => {
    await getTripperReviews("tripper-1", { page: 1, limit: 20, search: "Ana" });

    const where = findManyMock.mock.calls[0][0].where;
    expect(where.user).toEqual({
      name: { contains: "Ana", mode: "insensitive" },
    });
  });

  it("omits the user filter entirely when search is empty/undefined", async () => {
    await getTripperReviews("tripper-1", { page: 1, limit: 20 });

    const where = findManyMock.mock.calls[0][0].where;
    expect("user" in where).toBe(false);
  });

  it("applies the same status+search filter to the count query", async () => {
    await getTripperReviews("tripper-1", {
      page: 1,
      limit: 20,
      status: "unapproved",
      search: "Ana",
    });

    const countWhere = countMock.mock.calls[0][0].where;
    expect(countWhere).toMatchObject({
      tripperId: "tripper-1",
      isApproved: false,
      user: { name: { contains: "Ana", mode: "insensitive" } },
    });
  });

  it("includes isApproved in the mapped review output", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "r1",
        user: { id: "u1", name: "Ana", avatarUrl: null },
        rating: 5,
        title: null,
        content: "Great trip",
        destination: null,
        createdAt: new Date(),
        isPublic: false,
        isApproved: false,
      },
    ]);

    const { reviews } = await getTripperReviews("tripper-1", { page: 1, limit: 20 });

    expect(reviews[0].isApproved).toBe(false);
  });
});

describe("getTripperReviews — sort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
  });

  it("omitted sortBy/sortOrder falls back to createdAt desc (backward compat + honest default)", async () => {
    await getTripperReviews("tripper-1", { page: 1, limit: 20 });

    const { orderBy } = findManyMock.mock.calls[0][0];
    expect(orderBy[0]).toEqual({ createdAt: "desc" });
  });

  it("{ sortBy: 'rating', sortOrder: 'asc' } sorts by rating ascending", async () => {
    await getTripperReviews("tripper-1", {
      page: 1,
      limit: 20,
      sortBy: "rating",
      sortOrder: "asc",
    });

    const { orderBy } = findManyMock.mock.calls[0][0];
    expect(orderBy[0]).toEqual({ rating: "asc" });
  });

  it("where is byte-identical with and without sort params present", async () => {
    await getTripperReviews("tripper-1", {
      page: 1,
      limit: 20,
      status: "approved",
      search: "Ana",
    });
    const whereWithoutSort = findManyMock.mock.calls[0][0].where;

    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await getTripperReviews("tripper-1", {
      page: 1,
      limit: 20,
      status: "approved",
      search: "Ana",
      sortBy: "rating",
      sortOrder: "asc",
    });
    const whereWithSort = findManyMock.mock.calls[0][0].where;

    expect(whereWithSort).toEqual(whereWithoutSort);
  });
});

describe("getTripperReviewStats — always approved-only, unaffected by list status filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it("always filters isApproved: true regardless of any list-level status filter", async () => {
    await getTripperReviewStats("tripper-1");

    const where = findManyMock.mock.calls[0][0].where;
    expect(where).toEqual({ tripperId: "tripper-1", isApproved: true });
  });
});
