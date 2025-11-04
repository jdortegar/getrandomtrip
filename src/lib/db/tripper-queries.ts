// ============================================================================
// Tripper Database Queries
// ============================================================================

import { prisma } from '@/lib/prisma';
import type {
  FeaturedTrip,
  FeaturedTripCard,
  TripperProfile,
} from '@/types/tripper';

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
        role: 'TRIPPER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
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
    const packages = await prisma.package.findMany({
      where: {
        ownerId: tripper.id,
        isActive: true,
      },
      select: {
        type: true,
      },
      distinct: ['type'],
    });

    const availableTypes = packages.map((pkg) => pkg.type);

    return {
      ...tripper,
      tripperSlug: tripper.tripperSlug,
      commission: tripper.commission || 0,
      availableTypes,
    } as TripperProfile;
  } catch (error) {
    console.error('Error fetching tripper by slug:', error);
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
      where: { tripperSlug, role: 'TRIPPER' },
    });

    if (!tripper) return [];

    const trips = await prisma.package.findMany({
      where: {
        ownerId: tripper.id,
        isActive: true,
        isFeatured: true,
        status: 'ACTIVE', // Only show active packages
      },
      orderBy: { likes: 'desc' },
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
        displayPrice: true,
      },
    });

    // Map to FeaturedTripCard with defaults
    return trips.map((trip) => ({
      id: trip.id,
      title: trip.title || 'Aventura Sorpresa',
      teaser: trip.teaser || 'Una experiencia única diseñada por tu tripper.',
      heroImage: trip.heroImage || '/images/fallback.jpg',
      type: trip.type as any,
      level: trip.level as any,
      highlights: trip.highlights,
      tags: trip.tags,
      likes: trip.likes,
      nights: trip.minNights,
      pax: trip.minPax,
      displayPrice: trip.displayPrice,
    }));
  } catch (error) {
    console.error('Error fetching tripper featured trips:', error);
    return [];
  }
}

/**
 * Get all trippers (for listings/search)
 */
export async function getAllTrippers() {
  try {
    return await prisma.user.findMany({
      where: { role: 'TRIPPER' },
      select: {
        id: true,
        name: true,
        tripperSlug: true,
        avatarUrl: true,
        bio: true,
        location: true,
        commission: true,
        availableTypes: true,
        interests: true,
      },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching all trippers:', error);
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
    const existing = await prisma.packageLike.findUnique({
      where: {
        packageId_userId: { packageId: tripId, userId },
      },
    });

    if (existing) {
      // Unlike
      await prisma.packageLike.delete({
        where: { id: existing.id },
      });

      const trip = await prisma.package.update({
        where: { id: tripId },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      });

      return { liked: false, likes: trip.likes };
    } else {
      // Like
      await prisma.packageLike.create({
        data: { packageId: tripId, userId },
      });

      const trip = await prisma.package.update({
        where: { id: tripId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });

      return { liked: true, likes: trip.likes };
    }
  } catch (error) {
    console.error('Error toggling trip like:', error);
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
    const like = await prisma.packageLike.findUnique({
      where: {
        packageId_userId: { packageId: tripId, userId },
      },
    });

    return !!like;
  } catch (error) {
    console.error('Error checking trip like:', error);
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
    const trip = await prisma.package.findUnique({
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
    console.error('Error fetching trip by ID:', error);
    return null;
  }
}

/**
 * Get tripper packages organized by type and level
 * Returns packages directly without transformation - components handle the data structure
 */
export async function getTripperPackagesByTypeAndLevel(tripperId: string) {
  try {
    const packages = await prisma.package.findMany({
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
        basePriceUsd: true,
        displayPrice: true,
      },
      orderBy: [{ type: 'asc' }, { level: 'asc' }, { title: 'asc' }],
    });

    // Group packages by type and level
    const packagesByType: Record<string, Record<string, any[]>> = {};

    packages.forEach((pkg) => {
      const { type, level } = pkg;

      if (!packagesByType[type]) {
        packagesByType[type] = {};
      }

      if (!packagesByType[type][level]) {
        packagesByType[type][level] = [];
      }

      packagesByType[type][level].push(pkg);
    });

    return packagesByType;
  } catch (error) {
    console.error('Error fetching tripper packages:', error);
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
    const packages = await prisma.package.findMany({
      where: { ownerId: tripperId },
      select: { id: true, status: true, isActive: true },
    });

    // Get all trip requests that have packages owned by this tripper
    const tripRequests = await prisma.tripRequest.findMany({
      where: {
        package: {
          ownerId: tripperId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        package: {
          select: { id: true, title: true, basePriceUsd: true },
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
        tr.status === 'CONFIRMED' ||
        tr.status === 'REVEALED' ||
        tr.status === 'COMPLETED',
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
        (tr.payment.status === 'APPROVED' ||
          tr.payment.status === 'COMPLETED') &&
        paymentDate >= currentMonth
      );
    });

    const monthlyRevenue = monthlyPayments.reduce(
      (sum, tr) => sum + (tr.payment?.amount || 0),
      0,
    );

    // Average rating from completed trips
    const completedTrips = tripRequests.filter(
      (tr) => tr.status === 'COMPLETED' && tr.customerRating,
    );
    const averageRating =
      completedTrips.length > 0
        ? completedTrips.reduce(
            (sum, tr) => sum + (tr.customerRating || 0),
            0,
          ) / completedTrips.length
        : 0;

    // Active packages
    const activePackages = packages.filter(
      (pkg) => pkg.isActive && pkg.status === 'ACTIVE',
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
      activePackages,
      totalClients: uniqueClients,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Error fetching tripper dashboard stats:', error);
    return {
      totalBookings: 0,
      monthlyRevenue: 0,
      averageRating: 0,
      activePackages: 0,
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
        package: {
          ownerId: tripperId,
        },
        status: {
          in: ['CONFIRMED', 'REVEALED', 'COMPLETED'],
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        package: {
          select: { id: true, title: true, basePriceUsd: true },
        },
        payment: {
          select: { id: true, amount: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return bookings.map((booking) => ({
      id: booking.id,
      clientName: booking.user.name,
      clientEmail: booking.user.email,
      package: booking.package?.title || 'Paquete eliminado',
      packageId: booking.package?.id,
      date: booking.createdAt.toISOString(),
      amount: booking.payment?.amount || booking.package?.basePriceUsd || 0,
      status: booking.status.toLowerCase(),
      paymentStatus: booking.payment?.status?.toLowerCase() || 'pending',
    }));
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
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
        package: {
          ownerId: tripperId,
        },
        payment: {
          status: {
            in: ['APPROVED', 'COMPLETED'],
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
        package: {
          select: {
            id: true,
            basePriceUsd: true,
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
      if (!tr.payment || !tr.package) return;

      const paymentDate =
        tr.payment.paidAt || new Date(tr.payment.createdAt || Date.now());
      if (paymentDate < cutoffDate) return;

      const monthKey = `${paymentDate.getFullYear()}-${String(
        paymentDate.getMonth() + 1,
      ).padStart(2, '0')}`;
      const monthName = paymentDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
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

      const commission = tr.package.owner.commission || 0;
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
        month: new Date(monthKey + '-01').toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric',
        }),
        bookings: data.bookings,
        baseCommissionUSD: data.baseCommissionUSD,
        bonusUSD: data.bonusUSD,
        totalUSD: data.totalUSD,
        status: 'pending' as const, // TODO: Calculate actual payout status
        payoutDate: undefined, // TODO: Add payout tracking
      }))
      .sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error('Error fetching tripper earnings:', error);
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
        package: {
          ownerId: tripperId,
        },
        status: 'COMPLETED',
        customerRating: {
          not: null,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        package: {
          select: { id: true, title: true },
        },
      },
      orderBy: { completedAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
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
        title: `Viaje a ${trip.actualDestination || 'Destino'}`,
        content: trip.customerFeedback || '',
        tripType: trip.type,
        destination: trip.actualDestination || '',
        packageTitle: trip.package?.title || '',
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
    console.error('Error fetching tripper reviews:', error);
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
export async function getTripperPackages(tripperId: string) {
  try {
    const packages = await prisma.package.findMany({
      where: { ownerId: tripperId },
      select: {
        id: true,
        title: true,
        type: true,
        level: true,
        status: true,
        isActive: true,
        basePriceUsd: true,
        destinationCountry: true,
        destinationCity: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      slug: pkg.id, // Using ID as slug for now
      type: pkg.type,
      level: pkg.level,
      status: pkg.status.toLowerCase() as any,
      isActive: pkg.isActive,
      price: pkg.basePriceUsd,
      destination: `${pkg.destinationCity}, ${pkg.destinationCountry}`,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching tripper packages:', error);
    return [];
  }
}
