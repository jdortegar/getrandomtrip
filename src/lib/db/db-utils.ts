import { prisma } from '@/lib/prisma';
import type {
  CreateTripData,
  UpdateUserPrefsData,
  CreateReviewData,
  TripFilters,
  SearchParams,
  TripStats,
  UserStats,
} from './database';

// ========================================
// USER OPERATIONS
// ========================================

export async function createUser(data: {
  email: string;
  name: string;
  password?: string;
  avatarUrl?: string;
  travelerType?: string;
  interests?: string[];
  dislikes?: string[];
}) {
  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password || null,
      avatarUrl: data.avatarUrl || null,
      travelerType: data.travelerType || null,
      interests: data.interests || [],
      dislikes: data.dislikes || [],
    },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      trips: true,
      reviews: true,
    },
  });
}

export async function updateUserPrefs(
  userId: string,
  data: UpdateUserPrefsData,
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      travelerType: data.travelerType,
      interests: data.interests,
      dislikes: data.dislikes,
    },
  });
}

// ========================================
// TRIP OPERATIONS
// ========================================

export async function createTrip(userId: string, data: CreateTripData) {
  return await prisma.trip.create({
    data: {
      userId,
      from: data.from || '',
      type: data.type,
      level: data.level,
      country: data.country,
      city: data.city,
      startDate: data.startDate,
      endDate: data.endDate,
      nights: data.nights,
      pax: data.pax,
      transport: data.transport || 'avion',
      climate: data.climate || 'indistinto',
      maxTravelTime: data.maxTravelTime || 'sin-limite',
      departPref: data.departPref || 'indistinto',
      arrivePref: data.arrivePref || 'indistinto',
      avoidDestinations: data.avoidDestinations || [],
      addons: data.addons || [],
      basePriceUsd: data.basePriceUsd,
      displayPrice: data.displayPrice || '',
      filtersCostUsd: data.filtersCostUsd || 0,
      addonsCostUsd: data.addonsCostUsd || 0,
      totalPerPaxUsd: data.totalPerPaxUsd || 0,
      totalTripUsd: data.totalTripUsd || 0,
      status: (data.status as any) || 'DRAFT',
    },
  });
}

export async function getTripsByUserId(userId: string) {
  return await prisma.trip.findMany({
    where: { userId },
    include: {
      payment: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getTripById(id: string) {
  return await prisma.trip.findUnique({
    where: { id },
    include: {
      user: true,
      payment: true,
    },
  });
}

export async function updateTripStatus(id: string, status: string) {
  return await prisma.trip.update({
    where: { id },
    data: { status: status as any },
  });
}

// ========================================
// REVIEW OPERATIONS
// ========================================

export async function createReview(userId: string, data: CreateReviewData) {
  return await prisma.review.create({
    data: {
      userId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      tripType: data.tripType,
      destination: data.destination,
    },
  });
}

export async function getReviewsByUser(userId: string) {
  return await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// ========================================
// STATS OPERATIONS
// ========================================

export async function getUserStats(): Promise<UserStats> {
  const [total, newThisMonth, withTrips] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.user.count({
      where: {
        trips: {
          some: {},
        },
      },
    }),
  ]);

  return {
    total,
    active: total, // Simplified
    newThisMonth,
    withTrips,
  };
}

export async function getTripStats(): Promise<TripStats> {
  const [total, confirmed, byType] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.count({
      where: { status: 'CONFIRMED' },
    }),
    prisma.trip.groupBy({
      by: ['type'],
      _count: true,
    }),
  ]);

  const byTypeMap: Record<string, number> = {};
  byType.forEach((item) => {
    byTypeMap[item.type] = item._count;
  });

  return {
    total,
    byStatus: { CONFIRMED: confirmed },
    byType: byTypeMap,
    byLevel: {},
    revenue: {
      total: 0,
      average: 0,
      byMonth: [],
    },
  };
}
