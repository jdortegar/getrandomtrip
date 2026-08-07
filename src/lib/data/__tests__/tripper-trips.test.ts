import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    experience: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

import {
  getTripperAvailableTypesAndLevels,
  tripperHasExperiencesForTypeAndLevel,
  getTripperAvailableTypes,
  getTripperAvailableLevelsForType,
} from "../tripper-trips";
import { prisma } from "@/lib/prisma";

const userFindFirstMock = prisma.user.findFirst as ReturnType<typeof vi.fn>;
const expFindManyMock = prisma.experience.findMany as ReturnType<typeof vi.fn>;
const expFindFirstMock = prisma.experience.findFirst as ReturnType<
  typeof vi.fn
>;

describe("tripper-trips — owner-active guard (User-lookup, not Experience.isActive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTripperAvailableTypesAndLevels", () => {
    it("returns [] without querying Experience when the owner User lookup misses (inactive/missing owner)", async () => {
      userFindFirstMock.mockResolvedValue(null);

      const result = await getTripperAvailableTypesAndLevels("tripper-1");

      expect(result).toEqual([]);
      expect(expFindManyMock).not.toHaveBeenCalled();
      const args = userFindFirstMock.mock.calls[0][0];
      expect(args.where).toMatchObject({ id: "tripper-1", isActive: true });
    });

    it("returns the mapped packages when the owner is active", async () => {
      userFindFirstMock.mockResolvedValue({ id: "tripper-2" });
      expFindManyMock.mockResolvedValue([{ type: ["solo"], level: "essenza" }]);

      const result = await getTripperAvailableTypesAndLevels("tripper-2");

      expect(result).toEqual([{ type: ["solo"], level: "essenza" }]);
    });
  });

  describe("tripperHasExperiencesForTypeAndLevel", () => {
    it("returns false without querying Experience when the owner is inactive/missing", async () => {
      userFindFirstMock.mockResolvedValue(null);

      const result = await tripperHasExperiencesForTypeAndLevel(
        "tripper-1",
        "solo",
        "essenza",
      );

      expect(result).toBe(false);
      expect(expFindFirstMock).not.toHaveBeenCalled();
    });

    it("returns true when the owner is active and a matching package exists", async () => {
      userFindFirstMock.mockResolvedValue({ id: "tripper-2" });
      expFindFirstMock.mockResolvedValue({ id: "pkg-1" });

      const result = await tripperHasExperiencesForTypeAndLevel(
        "tripper-2",
        "solo",
        "essenza",
      );

      expect(result).toBe(true);
    });
  });

  describe("getTripperAvailableTypes", () => {
    it("returns [] without querying Experience when the owner is inactive/missing", async () => {
      userFindFirstMock.mockResolvedValue(null);

      const result = await getTripperAvailableTypes("tripper-1");

      expect(result).toEqual([]);
      expect(expFindManyMock).not.toHaveBeenCalled();
    });

    it("returns distinct types when the owner is active", async () => {
      userFindFirstMock.mockResolvedValue({ id: "tripper-2" });
      expFindManyMock.mockResolvedValue([
        { type: ["solo", "couple"] },
        { type: ["solo"] },
      ]);

      const result = await getTripperAvailableTypes("tripper-2");

      expect(result).toEqual(["solo", "couple"]);
    });
  });

  describe("getTripperAvailableLevelsForType", () => {
    it("returns [] without querying Experience when the owner is inactive/missing", async () => {
      userFindFirstMock.mockResolvedValue(null);

      const result = await getTripperAvailableLevelsForType(
        "tripper-1",
        "solo",
      );

      expect(result).toEqual([]);
      expect(expFindManyMock).not.toHaveBeenCalled();
    });

    it("returns non-null levels when the owner is active", async () => {
      userFindFirstMock.mockResolvedValue({ id: "tripper-2" });
      expFindManyMock.mockResolvedValue([{ level: "essenza" }, { level: null }]);

      const result = await getTripperAvailableLevelsForType(
        "tripper-2",
        "solo",
      );

      expect(result).toEqual(["essenza"]);
    });
  });
});
