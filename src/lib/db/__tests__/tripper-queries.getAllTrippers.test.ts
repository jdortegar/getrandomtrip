import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getAllTrippers } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const findManyMock = prisma.user.findMany as ReturnType<typeof vi.fn>;

describe("getAllTrippers — listing completeness + active filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it("filters by tripperSlug: { not: null } AND isActive: true in the same where clause", async () => {
    await getAllTrippers();

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toMatchObject({
      tripperSlug: { not: null },
      isActive: true,
    });
  });

  it("excludes any row that slips through with a null tripperSlug from the mapped result", async () => {
    findManyMock.mockResolvedValue([
      { id: "u1", name: "Ana", tripperSlug: "ana", avatarUrl: null, bio: null, location: null, commission: null, travelerType: null },
      { id: "u2", name: "No Slug", tripperSlug: null, avatarUrl: null, bio: null, location: null, commission: null, travelerType: null },
    ]);

    const result = await getAllTrippers();

    expect(result).toHaveLength(1);
    expect(result[0].tripperSlug).toBe("ana");
  });
});
