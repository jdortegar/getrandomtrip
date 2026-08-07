import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getTripperFeaturedTrips } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const findManyMock = prisma.experience.findMany as ReturnType<typeof vi.fn>;

describe("getTripperFeaturedTrips — matching exclusion (User-lookup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it("includes isActive: true in the User-lookup where clause", async () => {
    findUniqueMock.mockResolvedValue(null);

    await getTripperFeaturedTrips("some-slug");

    const args = findUniqueMock.mock.calls[0][0];
    expect(args.where).toMatchObject({
      tripperSlug: "some-slug",
      isActive: true,
    });
  });

  it("returns [] without querying Experience when the User lookup misses (inactive/missing owner)", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await getTripperFeaturedTrips("inactive-tripper");

    expect(result).toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns mapped trips when the owner is active", async () => {
    findUniqueMock.mockResolvedValue({ id: "tripper-1" });
    findManyMock.mockResolvedValue([
      {
        id: "trip-1",
        title: "Aventura",
        teaser: "Una experiencia",
        heroImage: "/hero.jpg",
        type: "solo",
        level: "essenza",
        activities: [],
        tags: [],
        likes: 5,
        minNights: 3,
        maxNights: 4,
        minPax: 1,
        maxPax: 2,
        pricingByType: { solo: 100 },
      },
    ]);

    const result = await getTripperFeaturedTrips("active-tripper");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("trip-1");
  });
});
