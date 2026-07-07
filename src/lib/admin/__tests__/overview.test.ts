import { describe, it, expect, vi } from "vitest";
import {
  computeAdminOverviewStats,
  type AdminOverviewPrismaClient,
} from "../overview";

function makeMockPrisma(
  overrides: Partial<{
    tripsSold: number;
    grossAmount: number | null;
    waitlist: number;
    xsedSignups: number;
    pendingExperiences: number;
    pendingDestination: number;
    pendingReviews: number;
  }> = {},
): AdminOverviewPrismaClient {
  const {
    tripsSold = 0,
    grossAmount = null,
    waitlist = 0,
    xsedSignups = 0,
    pendingExperiences = 0,
    pendingDestination = 0,
    pendingReviews = 0,
  } = overrides;

  // tripRequest.count is called twice (trips sold + pending destination
  // assignment) — resolve based on the `where.status` value passed in.
  const tripRequestCount = vi.fn(
    (args: { where: Record<string, unknown> }) =>
      args.where.status === "COMPLETED"
        ? Promise.resolve(tripsSold)
        : Promise.resolve(pendingDestination),
  );

  return {
    tripRequest: { count: tripRequestCount },
    payment: {
      aggregate: vi.fn(() =>
        Promise.resolve({ _sum: { amount: grossAmount } }),
      ),
    },
    waitlistEntry: { count: vi.fn(() => Promise.resolve(waitlist)) },
    xsedNotificationSignup: {
      count: vi.fn(() => Promise.resolve(xsedSignups)),
    },
    experience: { count: vi.fn(() => Promise.resolve(pendingExperiences)) },
    review: { count: vi.fn(() => Promise.resolve(pendingReviews)) },
  };
}

describe("computeAdminOverviewStats", () => {
  it("returns the correct output shape with all values populated", async () => {
    const prisma = makeMockPrisma({
      tripsSold: 42,
      grossAmount: 123456,
      waitlist: 7,
      xsedSignups: 3,
      pendingExperiences: 5,
      pendingDestination: 2,
      pendingReviews: 1,
    });

    const result = await computeAdminOverviewStats(prisma);

    expect(result).toEqual({
      stats: {
        tripsSold: 42,
        earnings: 123456,
        waitlist: 7,
        xsedSignups: 3,
      },
      pending: {
        experiences: 5,
        tripsDestination: 2,
        reviews: 1,
      },
    });
  });

  it("defaults gross earnings to 0 when the payment sum aggregate is null", async () => {
    const prisma = makeMockPrisma({ grossAmount: null });

    const result = await computeAdminOverviewStats(prisma);

    expect(result.stats.earnings).toBe(0);
  });

  it("returns all-zero stats and pending counts without error when nothing exists", async () => {
    const prisma = makeMockPrisma();

    const result = await computeAdminOverviewStats(prisma);

    expect(result).toEqual({
      stats: { tripsSold: 0, earnings: 0, waitlist: 0, xsedSignups: 0 },
      pending: { experiences: 0, tripsDestination: 0, reviews: 0 },
    });
  });

  it("queries trips sold with status=COMPLETED and destination-pending with status=CONFIRMED + actualDestination=null", async () => {
    const prisma = makeMockPrisma();

    await computeAdminOverviewStats(prisma);

    expect(prisma.tripRequest.count).toHaveBeenCalledWith({
      where: { status: "COMPLETED" },
    });
    expect(prisma.tripRequest.count).toHaveBeenCalledWith({
      where: { status: "CONFIRMED", actualDestination: null },
    });
  });

  it("queries gross earnings from APPROVED and COMPLETED USD payments only", async () => {
    const prisma = makeMockPrisma();

    await computeAdminOverviewStats(prisma);

    expect(prisma.payment.aggregate).toHaveBeenCalledWith({
      _sum: { amount: true },
      where: { status: { in: ["APPROVED", "COMPLETED"] }, currency: "USD" },
    });
  });

  it("queries pending experiences with status=PENDING_REVIEW and pending reviews with isApproved=false", async () => {
    const prisma = makeMockPrisma();

    await computeAdminOverviewStats(prisma);

    expect(prisma.experience.count).toHaveBeenCalledWith({
      where: { status: "PENDING_REVIEW" },
    });
    expect(prisma.review.count).toHaveBeenCalledWith({
      where: { isApproved: false },
    });
  });
});
