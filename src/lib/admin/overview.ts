/**
 * Server-side aggregation for the admin overview home page
 * (`/dashboard/admin`). Extracted from the page's server component so the
 * 7-query fan-out can be unit-tested without a live database — see
 * `__tests__/overview.test.ts`.
 */

/** Minimal Prisma client surface this module depends on (DI for testability). */
export interface AdminOverviewPrismaClient {
  tripRequest: {
    count: (args: {
      where: Record<string, unknown>;
    }) => Promise<number>;
  };
  payment: {
    aggregate: (args: {
      _sum: { amount: true };
      where: Record<string, unknown>;
    }) => Promise<{ _sum: { amount: number | null } }>;
  };
  waitlistEntry: {
    count: () => Promise<number>;
  };
  xsedNotificationSignup: {
    count: () => Promise<number>;
  };
  experience: {
    count: (args: {
      where: Record<string, unknown>;
    }) => Promise<number>;
  };
  review: {
    count: (args: {
      where: Record<string, unknown>;
    }) => Promise<number>;
  };
}

export interface AdminOverviewStats {
  stats: {
    /** Count of `TripRequest` rows with `status = COMPLETED`. */
    tripsSold: number;
    /**
     * Gross sum of `Payment.amount` for APPROVED/COMPLETED payments,
     * USD-only (displayed as a USD figure — `Payment.currency` also
     * supports ARS via MercadoPago, and summing across currencies would
     * silently blend incompatible units under one "$" label).
     */
    earnings: number;
    /** Count of `WaitlistEntry` rows. */
    waitlist: number;
    /** Count of `XsedNotificationSignup` rows. */
    xsedSignups: number;
  };
  pending: {
    /** Experiences with `status = PENDING_REVIEW`. */
    experiences: number;
    /** Trip requests `CONFIRMED` with no `actualDestination` assigned. */
    tripsDestination: number;
    /** Reviews with `isApproved = false`. */
    reviews: number;
  };
}

/**
 * Runs the 7 read-only queries behind the admin overview page in parallel.
 * All-time, no time-range filter, per spec `admin-dashboard-overview`.
 */
export async function computeAdminOverviewStats(
  prisma: AdminOverviewPrismaClient,
): Promise<AdminOverviewStats> {
  const [
    tripsSold,
    grossEarnings,
    waitlist,
    xsedSignups,
    pendingExperiences,
    pendingDestination,
    pendingReviews,
  ] = await Promise.all([
    prisma.tripRequest.count({ where: { status: "COMPLETED" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["APPROVED", "COMPLETED"] }, currency: "USD" },
    }),
    prisma.waitlistEntry.count(),
    prisma.xsedNotificationSignup.count(),
    prisma.experience.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.tripRequest.count({
      where: { status: "CONFIRMED", actualDestination: null },
    }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);

  return {
    stats: {
      tripsSold,
      earnings: grossEarnings._sum.amount ?? 0,
      waitlist,
      xsedSignups,
    },
    pending: {
      experiences: pendingExperiences,
      tripsDestination: pendingDestination,
      reviews: pendingReviews,
    },
  };
}
