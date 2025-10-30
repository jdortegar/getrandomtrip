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

