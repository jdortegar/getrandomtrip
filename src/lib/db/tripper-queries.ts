// ============================================================================
// Tripper Database Queries
// ============================================================================

import { prisma } from "@/lib/prisma";
import { primaryRoleFromMembership } from "@/lib/auth/prismaUserRoles";
import { interleavePostsByAuthor } from "@/lib/blog/interleavePostsByAuthor";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import {
  parseTripperPriceOverrides,
  type TripperPriceOverrides,
} from "@/lib/pricing/tripper-price-overrides";
import {
  REVIEW_SORT_DEFAULT,
  reviewListOrderBy,
  type ReviewSortOrder,
  type TripperReviewSortBy,
} from "@/lib/reviews/sort";
import type { BlogTeaserPost } from "@/lib/types/BlogIndexPost";
import { effectiveCommission } from "@/lib/tripper/commission";
import type {
  ActivityEntry,
  FeaturedTrip,
  FeaturedTripCard,
  TripperBySlugResult,
  TripperListItem,
  TripperProfile,
  TripperSessionExtras,
} from "@/types/tripper";
import type { TestimonialData } from "@/components/Testimonials/types";
import { formatReviewerAuthor } from "@/lib/helpers/formatReviewerAuthor";
import { slugify } from "@/lib/helpers/slugify";

/**
 * Get tripper profile by slug with a three-way discriminated result:
 * - not_found: no User row matches the slug
 * - inactive: User exists but isActive is false (render unavailable state, not 404)
 * - ok: User is active and the profile is ready to render
 *
 * A genuine DB failure (from either query) is rethrown rather than
 * collapsed into `not_found` — a 404 is a semantic claim the resource
 * does not exist, and a transient blip must not de-index a real profile.
 */
export async function getTripperBySlug(
  slug: string,
): Promise<TripperBySlugResult> {
  try {
    const tripper = await prisma.user.findUnique({
      where: {
        tripperSlug: slug,
        roles: { has: "TRIPPER" },
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        roles: true,
        tripperSlug: true,
        commission: true,
        interests: true,
        bio: true,
        heroImage: true,
        heroImagePositionX: true,
        heroImagePositionY: true,
        isActive: true,
        location: true,
        tierLevel: true,
        destinations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tripper || !tripper.tripperSlug) return { status: "not_found" };
    if (!tripper.isActive) {
      return { status: "inactive", name: tripper.nickname || tripper.name };
    }

    // Dynamically calculate availableTypes based on actual ACTIVE packages
    const packages = await prisma.experience.findMany({
      where: {
        ownerId: tripper.id,
        isActive: true,
        status: "ACTIVE",
      },
      select: { type: true },
    });

    const availableTypes = [...new Set(packages.flatMap((pkg) => pkg.type))];
    const { roles, nickname, ...tripperRest } = tripper;

    return {
      status: "ok",
      tripper: {
        ...tripperRest,
        name: nickname || tripper.name,
        avatarUrl: normalizeUploadUrl(tripper.avatarUrl),
        role: primaryRoleFromMembership(roles),
        tripperSlug: tripper.tripperSlug,
        commission: effectiveCommission(tripper.commission),
        availableTypes,
      } as unknown as TripperProfile,
    };
  } catch (error) {
    console.error("Error fetching tripper by slug:", error);
    throw error;
  }
}

/**
 * Derives a unique `tripperSlug` from a user's name (e.g. "Santi Senega" ->
 * "santi-senega"), appending "-2", "-3", etc. on collision. Used whenever a
 * user is granted the TRIPPER role/profile without supplying their own slug.
 */
export async function generateUniqueTripperSlug(
  name: string,
  excludeUserId?: string,
): Promise<string> {
  const base = slugify(name) || "tripper";
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.user.findFirst({
      where: {
        tripperSlug: candidate,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

/**
 * Get tripper's featured trips (for inspiration gallery)
 */
export async function getTripperFeaturedTrips(
  tripperSlug: string,
  limit: number = 3,
): Promise<FeaturedTripCard[]> {
  try {
    const tripper = await prisma.user.findUnique({
      where: { tripperSlug, roles: { has: "TRIPPER" }, isActive: true },
    });

    if (!tripper) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trips = await (prisma.experience.findMany as any)({
      where: {
        ownerId: tripper.id,
        isActive: true,
        isFeatured: true,
        status: "ACTIVE", // Only show active packages
      },
      orderBy: { likes: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        teaser: true,
        heroImage: true,
        type: true,
        level: true,
        activities: true,
        tags: true,
        likes: true,
        minNights: true,
        maxNights: true,
        minPax: true,
        maxPax: true,
        pricingByType: true,
      },
    }) as Array<{
      id: string; title: string; teaser: string; heroImage: string;
      type: string[]; level: string; activities: unknown; tags: string[];
      likes: number; minNights: number; minPax: number;
      pricingByType: Record<string, number> | null;
    }>;

    // Map to FeaturedTripCard with defaults
    return trips.map((trip) => ({
      id: trip.id,
      title: trip.title || "Aventura Sorpresa",
      teaser: trip.teaser || "Una experiencia única diseñada por tu tripper.",
      heroImage: trip.heroImage || "/images/fallback.jpg",
      type: trip.type as any,
      level: trip.level as any,
      highlights: (trip.activities as ActivityEntry[]).slice(0, 3).map((a) => a.name),
      tags: trip.tags,
      likes: trip.likes,
      nights: trip.minNights,
      pax: trip.minPax,
      displayPrice: trip.pricingByType
        ? `USD ${Math.min(...Object.values(trip.pricingByType)).toLocaleString()}`
        : "",
    }));
  } catch (error) {
    console.error("Error fetching tripper featured trips:", error);
    return [];
  }
}

/**
 * Get all trippers (for listings/search)
 * Only returns trippers who have completed onboarding (tripperSlug set) and are active.
 */
export async function getAllTrippers(): Promise<TripperListItem[]> {
  try {
    const trippers = await prisma.user.findMany({
      where: {
        roles: { has: "TRIPPER" },
        tripperSlug: { not: null },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        tripperSlug: true,
        avatarUrl: true,
        bio: true,
        location: true,
        commission: true,
        travelerType: true,
      },
      orderBy: { name: "asc" },
    });

    return trippers
      .filter(
        (t): t is typeof t & { tripperSlug: string } =>
          t.tripperSlug !== null,
      )
      .map((tripper) => ({
        id: tripper.id,
        name: tripper.name,
        tripperSlug: tripper.tripperSlug,
        avatarUrl: normalizeUploadUrl(tripper.avatarUrl),
        bio: tripper.bio,
        location: tripper.location,
        commission: tripper.commission,
        travelerType: tripper.travelerType,
      }));
  } catch (error) {
    console.error("Error fetching all trippers:", error);
    return [];
  }
}

/**
 * Toggle trip like
 */
export async function toggleTripLike(
  tripId: string,
  userId: string,
): Promise<{ liked: boolean; likes: number }> {
  try {
    const existing = await prisma.experienceLike.findUnique({
      where: {
        experienceId_userId: { experienceId: tripId, userId },
      },
    });

    if (existing) {
      // Unlike
      await prisma.experienceLike.delete({
        where: { id: existing.id },
      });

      const trip = await prisma.experience.update({
        where: { id: tripId },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      });

      return { liked: false, likes: trip.likes };
    } else {
      // Like
      await prisma.experienceLike.create({
        data: { experienceId: tripId, userId },
      });

      const trip = await prisma.experience.update({
        where: { id: tripId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });

      return { liked: true, likes: trip.likes };
    }
  } catch (error) {
    console.error("Error toggling trip like:", error);
    throw error;
  }
}

/**
 * Check if user has liked a trip
 */
export async function hasUserLikedTrip(
  tripId: string,
  userId: string,
): Promise<boolean> {
  try {
    const like = await prisma.experienceLike.findUnique({
      where: {
        experienceId_userId: { experienceId: tripId, userId },
      },
    });

    return !!like;
  } catch (error) {
    console.error("Error checking trip like:", error);
    return false;
  }
}

/**
 * Get trip by ID with owner info
 */
export async function getTripById(
  tripId: string,
): Promise<FeaturedTrip | null> {
  try {
    const trip = await prisma.experience.findUnique({
      where: { id: tripId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            tripperSlug: true,
          },
        },
      },
    });

    if (!trip) return null;

    return trip as any;
  } catch (error) {
    console.error("Error fetching trip by ID:", error);
    return null;
  }
}

/**
 * Get tripper packages organized by type and level
 * Returns packages directly without transformation - components handle the data structure
 */
export async function getTripperExperiencesByTypeAndLevel(tripperId: string) {
  try {
    const owner = await prisma.user.findFirst({
      where: { id: tripperId, isActive: true },
      select: { id: true },
    });
    if (!owner) return {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packages = await (prisma.experience.findMany as any)({
      where: {
        ownerId: tripperId,
        isActive: true,
        status: "ACTIVE",
      },
      select: {
        id: true,
        type: true,
        level: true,
        title: true,
        teaser: true,
        heroImage: true,
        tags: true,
        activities: true,
        excuseKey: true,
        destinationCountry: true,
        destinationCity: true,
        pricingByType: true,
      },
      orderBy: [{ type: "asc" }, { level: "asc" }, { title: "asc" }],
    }) as Array<{
      id: string; type: string[]; level: string | null; title: string;
      teaser: string; heroImage: string; tags: string[]; activities: unknown;
      excuseKey: string | null; destinationCountry: string; destinationCity: string;
      pricingByType: Record<string, number> | null;
    }>;

    // Group packages by type and level
    const packagesByType: Record<string, Record<string, any[]>> = {};

    packages.forEach((pkg) => {
      const { type, level } = pkg;
      const levelKey = level ?? "unknown";
      const types = Array.isArray(type) ? type : [type];

      types.forEach((t) => {
        if (!packagesByType[t]) packagesByType[t] = {};
        if (!packagesByType[t][levelKey]) packagesByType[t][levelKey] = [];
        packagesByType[t][levelKey].push(pkg);
      });
    });

    return packagesByType;
  } catch (error) {
    console.error("Error fetching tripper packages:", error);
    return {};
  }
}

// ============================================================================
// JOURNEY CONTEXT
// ============================================================================

export interface TripperJourneyContext {
  name: string;
  avatarUrl: string | null;
  location: string | null;
  /** Distinct ACTIVE experience types for this tripper. */
  allowedTypes: string[];
  /** For each type, the distinct non-null levels of ACTIVE experiences that include that type. */
  allowedLevelsByType: Record<string, string[]>;
  /** This tripper's price overrides, for override-aware price display before any TripRequest exists. */
  priceOverrides: TripperPriceOverrides | null;
}

/**
 * Discriminated result from getTripperJourneyContext, mirroring
 * getTripperBySlug's shape:
 * - not_found: no User row matches the slug
 * - inactive: User exists but isActive is false (no Experience query issued)
 * - ok: branding + allowed types/levels are ready
 */
export type TripperJourneyContextResult =
  | { status: "not_found" }
  | { status: "inactive"; name: string }
  | { status: "ok"; context: TripperJourneyContext };

/**
 * Returns branding + allowed types/levels for a tripper's curated journey.
 * Only considers experiences with status = ACTIVE.
 */
export async function getTripperJourneyContext(
  slug: string,
): Promise<TripperJourneyContextResult> {
  try {
    const tripper = await prisma.user.findUnique({
      where: {
        tripperSlug: slug,
        roles: { has: "TRIPPER" },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        location: true,
        isActive: true,
        tripperPriceOverrides: true,
      },
    });

    if (!tripper) return { status: "not_found" };
    if (!tripper.isActive) return { status: "inactive", name: tripper.name };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const experiences = await (prisma.experience.findMany as any)({
      where: {
        ownerId: tripper.id,
        status: "ACTIVE",
      },
      select: {
        type: true,
        level: true,
      },
    }) as Array<{ type: string[]; level: string | null }>;

    // Distinct flat-mapped types
    const allowedTypes = [...new Set(experiences.flatMap((e) => e.type))];

    // For each type, collect distinct non-null levels of experiences that include that type
    const allowedLevelsByType: Record<string, string[]> = {};
    for (const type of allowedTypes) {
      const levels = [
        ...new Set(
          experiences
            .filter((e) => e.type.includes(type) && e.level !== null)
            .map((e) => e.level as string),
        ),
      ];
      allowedLevelsByType[type] = levels;
    }

    return {
      status: "ok",
      context: {
        name: tripper.name,
        avatarUrl: normalizeUploadUrl(tripper.avatarUrl),
        location: tripper.location ?? null,
        allowedTypes,
        allowedLevelsByType,
        priceOverrides: parseTripperPriceOverrides(
          tripper.tripperPriceOverrides ?? null,
        ),
      },
    };
  } catch (error) {
    // Supplementary data for an otherwise-functional generic journey — a
    // transient DB blip degrades to "not_found" (unbranded journey) rather
    // than rethrowing, unlike getTripperBySlug's page-identity 404/500 split.
    console.error("Error fetching tripper journey context:", error);
    return { status: "not_found" };
  }
}

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get tripper dashboard statistics
 */
export async function getTripperDashboardStats(tripperId: string) {
  try {
    // Get all packages owned by tripper
    const packages = await prisma.experience.findMany({
      where: { ownerId: tripperId },
      select: { id: true, status: true, isActive: true },
    });

    // Count trip requests attributed to this tripper via the tripperId FK
    const attributedBookings = await prisma.tripRequest.count({
      where: {
        tripperId,
        status: { in: ["CONFIRMED", "REVEALED", "COMPLETED"] },
      },
    });

    // Get all trip requests that have packages owned by this tripper
    const tripRequests = await prisma.tripRequest.findMany({
      where: {
        experience: {
          ownerId: tripperId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        experience: {
          select: { id: true, title: true, basePrice: true },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
    });

    // Calculate stats
    const totalBookings = tripRequests.filter(
      (tr) =>
        tr.status === "CONFIRMED" ||
        tr.status === "REVEALED" ||
        tr.status === "COMPLETED",
    ).length;

    // Monthly revenue (from completed payments in current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = tripRequests.filter((tr) => {
      if (!tr.payment) return false;
      const paymentDate =
        tr.payment.paidAt || new Date(tr.payment.createdAt || Date.now());
      return (
        (tr.payment.status === "APPROVED" ||
          tr.payment.status === "COMPLETED") &&
        paymentDate >= currentMonth
      );
    });

    const monthlyRevenue = monthlyPayments.reduce(
      (sum, tr) => sum + (tr.payment?.amount || 0),
      0,
    );

    // Average rating from completed trips
    const completedTrips = tripRequests.filter(
      (tr) => tr.status === "COMPLETED" && tr.customerRating,
    );
    const averageRating =
      completedTrips.length > 0
        ? completedTrips.reduce(
            (sum, tr) => sum + (tr.customerRating || 0),
            0,
          ) / completedTrips.length
        : 0;

    // Active experiences
    const activeExperiences = packages.filter(
      (pkg) => pkg.isActive && pkg.status === "ACTIVE",
    ).length;

    // Total unique clients
    const uniqueClients = new Set(
      tripRequests.map((tr) => tr.user.id).filter(Boolean),
    ).size;

    // Conversion rate (completed trips / total trip requests)
    const totalTripRequests = tripRequests.length;
    const completedTripsCount = completedTrips.length;
    const conversionRate =
      totalTripRequests > 0
        ? (completedTripsCount / totalTripRequests) * 100
        : 0;

    return {
      totalBookings,
      monthlyRevenue,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      activeExperiences,
      totalClients: uniqueClients,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      attributedBookings,
    };
  } catch (error) {
    console.error("Error fetching tripper dashboard stats:", error);
    return {
      totalBookings: 0,
      monthlyRevenue: 0,
      averageRating: 0,
      activeExperiences: 0,
      totalClients: 0,
      conversionRate: 0,
      attributedBookings: 0,
    };
  }
}

/**
 * Get recent bookings for tripper dashboard
 */
export async function getTripperRecentBookings(
  tripperId: string,
  limit: number = 10,
) {
  try {
    const bookings = await prisma.tripRequest.findMany({
      where: {
        experience: {
          ownerId: tripperId,
        },
        status: {
          in: ["CONFIRMED", "REVEALED", "COMPLETED"],
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        experience: {
          select: { id: true, title: true, basePrice: true },
        },
        payment: {
          select: { id: true, amount: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return bookings.map((booking) => ({
      id: booking.id,
      clientName: booking.user.name,
      clientEmail: booking.user.email,
      experienceName: booking.experience?.title || "Experiencia eliminada",
      experienceId: booking.experience?.id,
      date: booking.createdAt.toISOString(),
      amount: booking.payment?.amount || booking.experience?.basePrice || 0,
      status: booking.status.toLowerCase(),
      paymentStatus: booking.payment?.status?.toLowerCase() || "pending",
    }));
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    return [];
  }
}

/**
 * Get tripper earnings by month
 */
export async function getTripperEarnings(
  tripperId: string,
  months: number = 6,
) {
  try {
    // Get all trip requests with payments for this tripper's packages
    const tripRequests = await prisma.tripRequest.findMany({
      where: {
        experience: {
          ownerId: tripperId,
        },
        payment: {
          status: {
            in: ["APPROVED", "COMPLETED"],
          },
        },
      },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
        },
        experience: {
          select: {
            id: true,
            basePrice: true,
            owner: {
              select: {
                commission: true,
              },
            },
          },
        },
      },
    });

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);

    // Group by month
    const earningsByMonth: Record<
      string,
      {
        bookings: number;
        baseCommissionUSD: number;
        bonusUSD: number;
        totalUSD: number;
        payments: any[];
      }
    > = {};

    tripRequests.forEach((tr) => {
      if (!tr.payment || !tr.experience) return;

      const paymentDate =
        tr.payment.paidAt || new Date(tr.payment.createdAt || Date.now());
      if (paymentDate < cutoffDate) return;

      const monthKey = `${paymentDate.getFullYear()}-${String(
        paymentDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      if (!earningsByMonth[monthKey]) {
        earningsByMonth[monthKey] = {
          bookings: 0,
          baseCommissionUSD: 0,
          bonusUSD: 0,
          totalUSD: 0,
          payments: [],
        };
      }

      const commission = effectiveCommission(tr.experience.owner.commission);
      const baseCommission = tr.payment.amount * commission;
      // Bonus calculation could be added based on tier level or performance
      const bonus = 0;

      earningsByMonth[monthKey].bookings += 1;
      earningsByMonth[monthKey].baseCommissionUSD += baseCommission;
      earningsByMonth[monthKey].bonusUSD += bonus;
      earningsByMonth[monthKey].totalUSD += baseCommission + bonus;
      earningsByMonth[monthKey].payments.push({
        id: tr.id,
        amount: tr.payment.amount,
        date: paymentDate,
      });
    });

    // Convert to array and sort by month (descending)
    return Object.entries(earningsByMonth)
      .map(([monthKey, data]) => ({
        id: monthKey,
        month: new Date(monthKey + "-01").toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        }),
        bookings: data.bookings,
        baseCommissionUSD: data.baseCommissionUSD,
        bonusUSD: data.bonusUSD,
        totalUSD: data.totalUSD,
        status: "pending" as const, // TODO: Calculate actual payout status
        payoutDate: undefined, // TODO: Add payout tracking
      }))
      .sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error("Error fetching tripper earnings:", error);
    return [];
  }
}

/**
 * Get tripper reviews and ratings
 */
/**
 * Dataset-wide review aggregate — deliberately independent of any page/limit
 * so it can't drift when the review list is paginated. Uses a `rating`-only
 * select instead of the full findMany used by getTripperReviews below.
 */
export async function getTripperReviewStats(tripperId: string) {
  try {
    const rows = await prisma.review.findMany({
      where: { tripperId, isApproved: true },
      select: { rating: true },
    });

    const ratings = rows.map((r) => r.rating);
    const totalReviews = ratings.length;

    const promoters = ratings.filter((r) => r >= 4).length;
    const detractors = ratings.filter((r) => r <= 2).length;
    const nps =
      totalReviews > 0
        ? ((promoters - detractors) / totalReviews) * 100
        : 0;

    const averageRating =
      totalReviews > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / totalReviews
        : 0;

    return {
      averageRating,
      totalReviews,
      nps: Math.round(nps * 10) / 10,
      promoters,
      detractors,
    };
  } catch (error) {
    console.error("Error fetching tripper review stats:", error);
    return { averageRating: 0, totalReviews: 0, nps: 0, promoters: 0, detractors: 0 };
  }
}

export async function getTripperReviews(
  tripperId: string,
  options: {
    page: number;
    limit: number;
    status?: "all" | "approved" | "unapproved";
    search?: string;
    sortBy?: TripperReviewSortBy;
    sortOrder?: ReviewSortOrder;
  },
) {
  const {
    page,
    limit,
    status = "all",
    search,
    sortBy = REVIEW_SORT_DEFAULT.sortBy,
    sortOrder = REVIEW_SORT_DEFAULT.sortOrder,
  } = options;
  try {
    const where = {
      tripperId,
      ...(status === "approved" ? { isApproved: true } : {}),
      ...(status === "unapproved" ? { isApproved: false } : {}),
      ...(search
        ? { user: { name: { contains: search, mode: "insensitive" as const } } }
        : {}),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: reviewListOrderBy(sortBy, sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const mapped = reviews.map((review) => ({
      id: review.id,
      userId: review.user.id,
      userName: review.user.name,
      userAvatar: review.user.avatarUrl,
      rating: review.rating,
      title: review.title ?? "",
      content: review.content,
      tripType: "",
      destination: review.destination ?? "",
      packageTitle: "",
      createdAt: review.createdAt,
      isPublic: review.isPublic,
      isApproved: review.isApproved,
    }));

    return { reviews: mapped, total };
  } catch (error) {
    console.error("Error fetching tripper reviews:", error);
    return { reviews: [], total: 0 };
  }
}

/**
 * Get all packages for tripper (for routes page)
 */
export async function getTripperExperiences(
  tripperId: string,
  pagination: { page: number; limit: number },
  filters: { status?: string; level?: string; type?: string; search?: string } = {},
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      ownerId: tripperId,
      isReviewCopy: false,
    };
    if (filters.status) where.status = filters.status;
    if (filters.level) where.level = filters.level;
    if (filters.type) where.type = { has: filters.type };
    if (filters.search) {
      where.title = { contains: filters.search, mode: "insensitive" };
    }

    const [packages, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.experience.findMany as any)({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          level: true,
          status: true,
          isActive: true,
          pricingByType: true,
          reviewNote: true,
          destinationCountry: true,
          destinationCity: true,
          minNights: true,
          maxNights: true,
          minPax: true,
          maxPax: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.experience.count as any)({ where }),
    ]);

    const experiences = packages.map((pkg: (typeof packages)[number]) => ({
      ...pkg,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    }));

    return { experiences, total };
  } catch (error) {
    console.error("Error fetching tripper packages:", error);
    return { experiences: [], total: 0 };
  }
}

/**
 * Get approved and public reviews for a tripper (for public profile)
 */
export async function getApprovedReviewsForTripper(tripperId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        tripperId,
        isApproved: true,
        isPublic: true,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews;
  } catch (error) {
    console.error("Error fetching approved reviews for tripper:", error);
    return [];
  }
}

const BLOG_CATEGORY_FALLBACK: Record<"es" | "en", string> = {
  es: "Viajes",
  en: "Travel",
};

/** Shared by getTripperPublishedBlogs and getRecentPublishedBlogs — same
 * visibility guards and shape, differing only by an optional author scope. */
async function queryPublishedBlogs({
  authorId,
  limit,
  locale = "es",
}: {
  authorId?: string;
  limit: number;
  locale?: "es" | "en";
}) {
  try {
    const blogs = await prisma.blogPost.findMany({
      where: {
        ...(authorId ? { authorId } : {}),
        status: "PUBLISHED",
        // Review copies (isReviewCopy: true) share authorId with the
        // original and must never leak into this public-facing list.
        isReviewCopy: false,
        // Tripper-unpublished posts stay PUBLISHED (approval history) but
        // must not appear on the public profile.
        isActive: true,
        // Filtered in the query (not after `take`) so a short run of
        // cover-less posts can't shrink the result below `limit`.
        coverUrl: { not: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        coverUrl: true,
        tags: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    const fallbackCategory = BLOG_CATEGORY_FALLBACK[locale];

    return blogs.map((blog) => ({
      category: blog.tags[0] ?? fallbackCategory,
      href: `/blog/${blog.slug ?? blog.id}`,
      image: blog.coverUrl!,
      title: blog.title,
    }));
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    return [];
  }
}

/**
 * Get published blog posts for a tripper (for public profile)
 */
export async function getTripperPublishedBlogs(
  tripperId: string,
  limit: number = 6,
  locale: "es" | "en" = "es",
) {
  return queryPublishedBlogs({ authorId: tripperId, limit, locale });
}

/**
 * Get the most recently published blog posts across all trippers (for the home page).
 */
export async function getRecentPublishedBlogs(
  limit: number = 5,
  locale: "es" | "en" = "es",
) {
  return queryPublishedBlogs({ limit, locale });
}

/**
 * Recent published posts, round-robined across trippers so a single prolific
 * tripper doesn't fill a short teaser section (e.g. the trippers page).
 */
export async function getBlogTeaserPosts(
  limit: number = 3,
): Promise<BlogTeaserPost[]> {
  try {
    const blogs = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        isReviewCopy: false,
        isActive: true,
        coverUrl: { not: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        coverUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            tripperSlug: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      // Wide enough pool that the round-robin below can actually diversify
      // authors instead of just re-sorting a single tripper's recent run.
      take: limit * 10,
    });

    const interleaved = interleavePostsByAuthor(
      blogs,
      (blog) => blog.author.id,
    ).slice(0, limit);

    return interleaved.map((blog) => ({
      author: {
        avatarUrl: normalizeUploadUrl(blog.author.avatarUrl) ?? "",
        id: blog.author.id,
        location: blog.author.location ?? undefined,
        name: blog.author.name,
        slug: blog.author.tripperSlug ?? "",
      },
      coverUrl: blog.coverUrl,
      slug: blog.slug ?? blog.id,
      subtitle: blog.subtitle ?? "",
      title: blog.title,
    }));
  } catch (error) {
    console.error("Error fetching blog teaser posts:", error);
    return [];
  }
}

/** Approved and public reviews left by travelers of a given trip type ('solo', 'family', etc). */
export async function getReviewsForTripType(
  tripType: string,
): Promise<TestimonialData[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: true, isPublic: true, tripType },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: {
        content: true,
        destination: true,
        tripRequest: { select: { originCountry: true } },
        user: { select: { name: true } },
      },
    });

    return reviews.map((r) => ({
      author: formatReviewerAuthor(r.user.name),
      country: r.tripRequest?.originCountry ?? "",
      quote: r.content,
    }));
  } catch (error) {
    console.error("Error fetching trip type testimonials:", error);
    return [];
  }
}

/**
 * Shared shaping logic behind GET /api/user/tripper, also used for
 * server-side initial data on the tripper settings page.
 */
export async function getTripperSettingsExtras(
  userId: string,
): Promise<TripperSessionExtras | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      availableTypes: true,
      bio: true,
      commission: true,
      destinations: true,
      heroImage: true,
      heroImagePositionX: true,
      heroImagePositionY: true,
      isActive: true,
      location: true,
      nickname: true,
      socialLinks: true,
      tierLevel: true,
      tripperSlug: true,
    },
  });

  if (!user) return null;

  return {
    ...user,
    bio: user.bio ?? undefined,
    commission: user.commission ?? undefined,
    heroImage: user.heroImage ?? undefined,
    location: user.location ?? undefined,
    nickname: user.nickname ?? undefined,
    socialLinks: (Array.isArray(user.socialLinks)
      ? user.socialLinks
      : []) as unknown as TripperSessionExtras["socialLinks"],
    tierLevel: user.tierLevel ?? undefined,
    tripperSlug: user.tripperSlug ?? undefined,
  };
}

export async function getHomepageTestimonials(): Promise<TestimonialData[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: true, isPublic: true, tripperId: null },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: {
        content: true,
        destination: true,
        tripRequest: { select: { originCountry: true } },
        user: { select: { name: true } },
      },
    });

    return reviews.map((r) => ({
      author: formatReviewerAuthor(r.user.name),
      country: r.tripRequest?.originCountry ?? "",
      quote: r.content,
    }));
  } catch (error) {
    console.error("Error fetching homepage testimonials:", error);
    return [];
  }
}
