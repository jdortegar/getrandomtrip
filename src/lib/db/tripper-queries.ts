// ============================================================================
// Tripper Database Queries
// ============================================================================

import { prisma } from "@/lib/prisma";
import { primaryRoleFromMembership } from "@/lib/auth/prismaUserRoles";
import { normalizeUploadUrl } from "@/lib/media/upload-url";
import type {
  FeaturedTrip,
  FeaturedTripCard,
  TripperListItem,
  TripperProfile,
} from "@/types/tripper";

/**
 * Get tripper profile by slug
 */
export async function getTripperBySlug(
  slug: string,
): Promise<TripperProfile | null> {
  try {
    const tripper = await prisma.user.findUnique({
      where: {
        tripperSlug: slug,
        roles: { has: "TRIPPER" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        roles: true,
        tripperSlug: true,
        commission: true,
        interests: true,
        bio: true,
        heroImage: true,
        location: true,
        tierLevel: true,
        destinations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tripper || !tripper.tripperSlug) return null;

    // Dynamically calculate availableTypes based on actual packages
    const packages = await prisma.experience.findMany({
      where: {
        ownerId: tripper.id,
        isActive: true,
      },
      select: {
        type: true,
      },
      distinct: ["type"],
    });

    const availableTypes = [...new Set(packages.flatMap((pkg) => pkg.type))];

    const { roles, ...tripperRest } = tripper;

    return {
      ...tripperRest,
      avatarUrl: normalizeUploadUrl(tripper.avatarUrl),
      role: primaryRoleFromMembership(roles),
      tripperSlug: tripper.tripperSlug,
      commission: tripper.commission || 0,
      availableTypes,
    } as TripperProfile;
  } catch (error) {
    console.error("Error fetching tripper by slug:", error);
    return null;
  }
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
      where: { tripperSlug, roles: { has: "TRIPPER" } },
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
        highlights: true,
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
      type: string[]; level: string; highlights: string[]; tags: string[];
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
      highlights: trip.highlights,
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
 */
export async function getAllTrippers(): Promise<TripperListItem[]> {
  try {
    const trippers = await prisma.user.findMany({
      where: { roles: { has: "TRIPPER" } },
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

    return trippers.map((tripper) => ({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packages = await (prisma.experience.findMany as any)({
      where: {
        ownerId: tripperId,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        level: true,
        title: true,
        teaser: true,
        heroImage: true,
        tags: true,
        highlights: true,
        excuseKey: true,
        destinationCountry: true,
        destinationCity: true,
        pricingByType: true,
      },
      orderBy: [{ type: "asc" }, { level: "asc" }, { title: "asc" }],
    }) as Array<{
      id: string; type: string[]; level: string | null; title: string;
      teaser: string; heroImage: string; tags: string[]; highlights: string[];
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
      const monthName = paymentDate.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });

      if (!earningsByMonth[monthKey]) {
        earningsByMonth[monthKey] = {
          bookings: 0,
          baseCommissionUSD: 0,
          bonusUSD: 0,
          totalUSD: 0,
          payments: [],
        };
      }

      const commission = tr.experience.owner.commission || 0;
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
export async function getTripperReviews(tripperId: string) {
  try {
    // Get reviews from completed trips that used this tripper's packages
    const completedTrips = await prisma.tripRequest.findMany({
      where: {
        experience: {
          ownerId: tripperId,
        },
        status: "COMPLETED",
        customerRating: {
          not: null,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        experience: {
          select: { id: true, title: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Also get general reviews (from Review model) if they reference this tripper
    const generalReviews = await prisma.review.findMany({
      where: {
        isApproved: true,
        isPublic: true,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate NPS (Net Promoter Score)
    const ratings = completedTrips
      .map((trip) => trip.customerRating)
      .filter((r): r is number => r !== null);

    const promoters = ratings.filter((r) => r >= 4).length;
    const detractors = ratings.filter((r) => r <= 2).length;
    const totalRatings = ratings.length;
    const nps =
      totalRatings > 0 ? ((promoters - detractors) / totalRatings) * 100 : 0;

    return {
      reviews: completedTrips.map((trip) => ({
        id: trip.id,
        userId: trip.user.id,
        userName: trip.user.name,
        userAvatar: trip.user.avatarUrl,
        rating: trip.customerRating || 0,
        title: `Viaje a ${trip.actualDestination || "Destino"}`,
        content: trip.customerFeedback || "",
        tripType: trip.type,
        destination: trip.actualDestination || "",
        packageTitle: trip.experience?.title || "",
        createdAt: trip.completedAt || trip.updatedAt,
      })),
      averageRating:
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 0,
      totalReviews: totalRatings,
      nps: Math.round(nps * 10) / 10,
      promoters,
      detractors,
    };
  } catch (error) {
    console.error("Error fetching tripper reviews:", error);
    return {
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
      nps: 0,
      promoters: 0,
      detractors: 0,
    };
  }
}

/**
 * Get all packages for tripper (for routes page)
 */
export async function getTripperExperiences(tripperId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packages = await (prisma.experience.findMany as any)({
      where: { ownerId: tripperId },
      select: {
        id: true,
        title: true,
        type: true,
        level: true,
        status: true,
        isActive: true,
        pricingByType: true,
        destinationCountry: true,
        destinationCity: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }) as Array<{
      id: string; title: string; type: string[]; level: string | null;
      status: string; isActive: boolean; pricingByType: unknown;
      destinationCountry: string; destinationCity: string;
      createdAt: Date; updatedAt: Date;
    }>;

    return packages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      slug: pkg.id, // Using ID as slug for now
      type: pkg.type,
      level: pkg.level,
      status: pkg.status.toLowerCase() as any,
      isActive: pkg.isActive,
      pricingByType: pkg.pricingByType as Record<string, number> | null,
      destination: `${pkg.destinationCity}, ${pkg.destinationCountry}`,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching tripper packages:", error);
    return [];
  }
}

/**
 * Get published blog posts for a tripper (for public profile)
 */
export async function getTripperPublishedBlogs(
  tripperId: string,
  limit: number = 6,
) {
  try {
    const blogs = await prisma.blogPost.findMany({
      where: {
        authorId: tripperId,
        status: "PUBLISHED",
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

    // Transform to match Blog component format; only include posts with a cover
    return blogs
      .filter(
        (blog): blog is typeof blog & { coverUrl: string } =>
          blog.coverUrl != null,
      )
      .map((blog) => ({
        category: blog.tags[0] ?? "Viajes",
        href: `/blog/${blog.slug ?? blog.id}`,
        image: blog.coverUrl,
        title: blog.title,
      }));
  } catch (error) {
    console.error("Error fetching tripper published blogs:", error);
    return [];
  }
}
