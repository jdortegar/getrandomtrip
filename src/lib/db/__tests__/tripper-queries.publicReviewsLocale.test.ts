import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import {
  getApprovedReviewsForTripper,
  getHomepageTestimonials,
  getReviewsForTripType,
} from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const findManyMock = prisma.review.findMany as ReturnType<typeof vi.fn>;

function lastWhere() {
  return findManyMock.mock.calls.at(-1)?.[0].where;
}

describe("public review queries — locale filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  describe("getHomepageTestimonials", () => {
    it("defaults to es reviews", async () => {
      await getHomepageTestimonials();
      expect(lastWhere()).toMatchObject({
        isApproved: true,
        isPublic: true,
        tripperId: null,
        locale: "es",
      });
    });

    it("filters by the given locale", async () => {
      await getHomepageTestimonials("en");
      expect(lastWhere()).toMatchObject({ locale: "en" });
    });
  });

  describe("getReviewsForTripType", () => {
    it("defaults to es reviews", async () => {
      await getReviewsForTripType("solo");
      expect(lastWhere()).toMatchObject({
        isApproved: true,
        isPublic: true,
        tripType: "solo",
        locale: "es",
      });
    });

    it("filters by the given locale", async () => {
      await getReviewsForTripType("solo", "en");
      expect(lastWhere()).toMatchObject({ tripType: "solo", locale: "en" });
    });
  });

  describe("getApprovedReviewsForTripper", () => {
    it("defaults to es reviews", async () => {
      await getApprovedReviewsForTripper("tripper-1");
      expect(lastWhere()).toMatchObject({
        tripperId: "tripper-1",
        isApproved: true,
        isPublic: true,
        locale: "es",
      });
    });

    it("filters by the given locale", async () => {
      await getApprovedReviewsForTripper("tripper-1", "en");
      expect(lastWhere()).toMatchObject({ tripperId: "tripper-1", locale: "en" });
    });
  });
});
