import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    experience: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getTripperExperiencesByTypeAndLevel } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const userFindFirstMock = prisma.user.findFirst as ReturnType<typeof vi.fn>;
const findManyMock = prisma.experience.findMany as ReturnType<typeof vi.fn>;

describe("getTripperExperiencesByTypeAndLevel — matching exclusion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindFirstMock.mockResolvedValue({ id: "tripper-1" });
    findManyMock.mockResolvedValue([]);
  });

  it("guards owner-active via a User-lookup pre-check (not a relation filter on the Experience query)", async () => {
    await getTripperExperiencesByTypeAndLevel("tripper-1");

    const userArgs = userFindFirstMock.mock.calls[0][0];
    expect(userArgs.where).toMatchObject({ id: "tripper-1", isActive: true });

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toMatchObject({ ownerId: "tripper-1" });
    expect(args.where.owner).toBeUndefined();
    // The defect this guards against: isActive: true placed at the top
    // level of an Experience query means Experience.isActive (an
    // unrelated field), not the owner's. The owner check happens
    // separately via the User-lookup pre-check above.
    expect(args.where.isActive).toBe(true);
  });

  it("returns an empty grouping without querying Experience when the owner User lookup misses (inactive/missing owner)", async () => {
    userFindFirstMock.mockResolvedValue(null);

    const result = await getTripperExperiencesByTypeAndLevel("tripper-2");

    expect(result).toEqual({});
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("groups a real package by type and level when the owner is active", async () => {
    userFindFirstMock.mockResolvedValue({ id: "tripper-3" });
    findManyMock.mockResolvedValue([
      { id: "pkg-1", type: ["solo"], level: "essenza", title: "Trip" },
    ]);

    const result = await getTripperExperiencesByTypeAndLevel("tripper-3");

    expect(result.solo.essenza).toHaveLength(1);
    expect(result.solo.essenza[0].id).toBe("pkg-1");
  });
});
