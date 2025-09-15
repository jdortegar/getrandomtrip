import { prisma } from './prisma';
import type {
  CreateBookingData,
  UpdateUserPrefsData,
  CreateReviewData,
  BookingFilters,
  TripperFilters,
  SearchParams,
  BookingStats,
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
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
      avatarUrl: data.avatarUrl,
      travelerType: data.travelerType,
      interests: data.interests || [],
      dislikes: data.dislikes || [],
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUserPrefs(
  userId: string,
  prefs: UpdateUserPrefsData,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      travelerType: prefs.travelerType,
      interests: prefs.interests,
      dislikes: prefs.dislikes,
    },
  });
}

export async function getUserWithBookings(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        orderBy: { createdAt: 'desc' },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

// ========================================
// BOOKING OPERATIONS
// ========================================

export async function createBooking(userId: string, data: CreateBookingData) {
  return prisma.booking.create({
    data: {
      userId,
      from: data.from,
      travelType: data.travelType,
      experienceLevel: data.experienceLevel,
      origin: data.origin,
      originCity: data.originCity,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      nights: data.nights,
      durationNights: data.durationNights,
      travelerCount: data.travelerCount,
      destination: data.destination,
      destinationCountry: data.destinationCountry,
      destinationCity: data.destinationCity,
      basePrice: data.basePrice,
      filtersCost: data.filtersCost,
      addonsCost: data.addonsCost,
      totalPrice: data.totalPrice,
      displayPrice: data.displayPrice,
      activeTab: data.activeTab,
      selectedAddons: data.selectedAddons, // legacy field
    },
  });
}

export async function getBookings(
  filters: BookingFilters = {},
  params: SearchParams = {},
) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const where: any = {};

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters.travelType?.length) {
    where.travelType = { in: filters.travelType };
  }

  if (filters.experienceLevel?.length) {
    where.experienceLevel = { in: filters.experienceLevel };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {};
    if (filters.dateFrom) where.startDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.startDate.lte = new Date(filters.dateTo);
  }

  if (filters.minPrice || filters.maxPrice) {
    where.totalPrice = {};
    if (filters.minPrice) where.totalPrice.gte = filters.minPrice;
    if (filters.maxPrice) where.totalPrice.lte = filters.maxPrice;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        addonSelections: {
          include: {
            addon: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      addonSelections: {
        include: {
          addon: true,
        },
      },
    },
  });
}

export async function updateBookingStatus(id: string, status: string) {
  return prisma.booking.update({
    where: { id },
    data: { status: status as any },
  });
}

// ========================================
// TRIPPER OPERATIONS
// ========================================

export async function getTrippers(
  filters: TripperFilters = {},
  params: SearchParams = {},
) {
  const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = params;

  const where: any = { isActive: true };

  if (filters.tierLevel?.length) {
    where.tierLevel = { in: filters.tierLevel };
  }

  if (filters.destinations?.length) {
    where.destinations = { hasSome: filters.destinations };
  }

  if (filters.interests?.length) {
    where.interests = { hasSome: filters.interests };
  }

  if (filters.languages?.length) {
    where.languages = { hasSome: filters.languages };
  }

  const [trippers, total] = await Promise.all([
    prisma.tripper.findMany({
      where,
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tripper.count({ where }),
  ]);

  return {
    data: trippers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTripperBySlug(slug: string) {
  return prisma.tripper.findUnique({
    where: { slug },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// ========================================
// ADDON OPERATIONS
// ========================================

export async function getAddons(category?: string) {
  const where = category ? { category, isActive: true } : { isActive: true };

  return prisma.addon.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getAddonById(id: string) {
  return prisma.addon.findUnique({
    where: { id },
  });
}

// ========================================
// PREMIUM PACKAGE OPERATIONS
// ========================================

export async function getPremiumPackages() {
  return prisma.premiumPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

// ========================================
// REVIEW OPERATIONS
// ========================================

export async function createReview(userId: string, data: CreateReviewData) {
  return prisma.review.create({
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

export async function getReviews(params: SearchParams = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: true, isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { isApproved: true, isPublic: true } }),
  ]);

  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ========================================
// BITACORA OPERATIONS
// ========================================

export async function getBitacoras(params: SearchParams = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = params;

  const [bitacoras, total] = await Promise.all([
    prisma.bitacora.findMany({
      where: { isPublished: true },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bitacora.count({ where: { isPublished: true } }),
  ]);

  return {
    data: bitacoras,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBitacoraBySlug(slug: string) {
  return prisma.bitacora.findUnique({
    where: { slug },
  });
}

// ========================================
// STATISTICS OPERATIONS
// ========================================

export async function getBookingStats(): Promise<BookingStats> {
  const [total, byStatus, byTravelType, byExperienceLevel, revenueData] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.booking.groupBy({
        by: ['travelType'],
        _count: { travelType: true },
      }),
      prisma.booking.groupBy({
        by: ['experienceLevel'],
        _count: { experienceLevel: true },
      }),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        _avg: { totalPrice: true },
      }),
    ]);

  return {
    total,
    byStatus: byStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>,
    ),
    byTravelType: byTravelType.reduce(
      (acc, item) => {
        acc[item.travelType] = item._count.travelType;
        return acc;
      },
      {} as Record<string, number>,
    ),
    byExperienceLevel: byExperienceLevel.reduce(
      (acc, item) => {
        acc[item.experienceLevel] = item._count.experienceLevel;
        return acc;
      },
      {} as Record<string, number>,
    ),
    revenue: {
      total: Number(revenueData._sum.totalPrice || 0),
      average: Number(revenueData._avg.totalPrice || 0),
      byMonth: [], // TODO: Implement monthly revenue aggregation
    },
  };
}

export async function getUserStats(): Promise<UserStats> {
  const [total, active, newThisMonth, withBookings] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        bookings: {
          some: {
            status: { in: ['CONFIRMED', 'REVEALED'] },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.user.count({
      where: {
        bookings: {
          some: {},
        },
      },
    }),
  ]);

  return {
    total,
    active,
    newThisMonth,
    withBookings,
  };
}
