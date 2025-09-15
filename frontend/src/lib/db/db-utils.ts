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
  avatarUrl?: string;
  travelerType?: string;
  interests?: string[];
  dislikes?: string[];
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      travelerType: data.travelerType,
      interests: data.interests || [],
      dislikes: data.dislikes || [],
    },
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

export async function createBookingWithFilters(
  userId: string,
  bookingData: CreateBookingData,
  filterSelections: Array<{
    filterKey: string;
    value: string;
    price?: number;
  }>,
) {
  // Create the booking first
  const booking = await createBooking(userId, bookingData);

  // Create filter entries for each selection
  const bookingFilters = await Promise.all(
    filterSelections.map(async (selection) => {
      // Find the filter by key
      const filter = await prisma.filter.findUnique({
        where: { key: selection.filterKey },
      });

      if (!filter) {
        throw new Error(`Filter with key '${selection.filterKey}' not found`);
      }

      // Create the booking filter entry
      return prisma.bookingFilter.create({
        data: {
          bookingId: booking.id,
          filterId: filter.id,
          value: selection.value,
          price: selection.price || 0,
        },
      });
    }),
  );

  return {
    booking,
    bookingFilters,
  };
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

// ========================================
// PROVIDER OPERATIONS
// ========================================

export async function createProvider(data: {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  companyType?: string;
  country?: string;
  city?: string;
  logo?: string;
  tags?: string[];
}) {
  return prisma.provider.create({
    data: {
      name: data.name,
      description: data.description,
      email: data.email,
      phone: data.phone,
      website: data.website,
      companyType: data.companyType,
      country: data.country,
      city: data.city,
      logo: data.logo,
      tags: data.tags || [],
    },
  });
}

export async function getProviders() {
  return prisma.provider.findMany({
    where: { isActive: true },
    include: { addons: true },
    orderBy: { name: 'asc' },
  });
}

export async function getProviderById(id: string) {
  return prisma.provider.findUnique({
    where: { id },
    include: { addons: true },
  });
}

// ========================================
// ADDON OPERATIONS (Updated)
// ========================================

export async function createAddon(data: {
  name: string;
  description?: string;
  category: string;
  price: number;
  currency?: string;
  unit?: string;
  providerId: string;
  image?: string;
  icon?: string;
  tags?: string[];
  serviceType?: string;
  duration?: string;
  location?: string;
}) {
  return prisma.addon.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      currency: data.currency || 'USD',
      unit: data.unit || 'per_trip',
      providerId: data.providerId,
      image: data.image,
      icon: data.icon,
      tags: data.tags || [],
      serviceType: data.serviceType,
      duration: data.duration,
      location: data.location,
    },
    include: { provider: true },
  });
}

// ========================================
// FILTER OPERATIONS
// ========================================

export async function createFilter(data: {
  key: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency?: string;
  icon?: string;
  options?: any[];
}) {
  return prisma.filter.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price || 0,
      currency: data.currency || 'USD',
      icon: data.icon,
      options: data.options,
    },
  });
}

export async function getFilters(category?: string) {
  return prisma.filter.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getPremiumFilters(category?: string) {
  return prisma.premiumFilter.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
    },
    orderBy: { sortOrder: 'asc' },
  });
}

// ========================================
// PAYMENT OPERATIONS
// ========================================

export async function createPayment(data: {
  bookingId: string;
  provider: string;
  providerPaymentId?: string;
  providerPreferenceId?: string;
  providerSessionId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  cardLast4?: string;
  cardBrand?: string;
  providerResponse?: any;
}) {
  return prisma.payment.create({
    data: {
      bookingId: data.bookingId,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      providerPreferenceId: data.providerPreferenceId,
      providerSessionId: data.providerSessionId,
      amount: data.amount,
      currency: data.currency || 'USD',
      paymentMethod: data.paymentMethod,
      cardLast4: data.cardLast4,
      cardBrand: data.cardBrand,
      providerResponse: data.providerResponse,
    },
    include: { booking: true },
  });
}

export async function updatePaymentStatus(
  id: string,
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
  paidAt?: Date,
  failedAt?: Date,
  refundedAt?: Date,
) {
  return prisma.payment.update({
    where: { id },
    data: {
      status,
      ...(paidAt && { paidAt }),
      ...(failedAt && { failedAt }),
      ...(refundedAt && { refundedAt }),
    },
  });
}

// ========================================
// BLOG POST OPERATIONS
// ========================================

export async function createBlogPost(data: {
  tripperId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  gallery?: any[];
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  category?: string;
  readTime?: number;
  destination?: string;
  country?: string;
  city?: string;
  relatedTripType?: string;
  experienceLevel?: string;
}) {
  return prisma.blogPost.create({
    data: {
      tripperId: data.tripperId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage,
      gallery: data.gallery,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      tags: data.tags || [],
      category: data.category,
      readTime: data.readTime,
      destination: data.destination,
      country: data.country,
      city: data.city,
      relatedTripType: data.relatedTripType,
      experienceLevel: data.experienceLevel,
    },
    include: { tripper: true, comments: true },
  });
}

export async function getBlogPosts(params: SearchParams = {}) {
  const {
    q,
    page = 1,
    limit = 10,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = params;
  const skip = (page - 1) * limit;

  return prisma.blogPost.findMany({
    where: {
      isPublished: true,
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    include: { tripper: true, comments: true },
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
  });
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: { tripper: true, comments: { where: { isApproved: true } } },
  });
}

export async function createBlogComment(data: {
  postId: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
  content: string;
}) {
  return prisma.blogComment.create({
    data: {
      postId: data.postId,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      authorWebsite: data.authorWebsite,
      content: data.content,
    },
  });
}
