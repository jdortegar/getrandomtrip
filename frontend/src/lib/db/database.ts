import type { Prisma } from '@prisma/client';

// ========================================
// ENHANCED TYPES WITH RELATIONS
// ========================================

export type UserWithBookings = Prisma.UserGetPayload<{
  include: {
    bookings: true;
    reviews: true;
  };
}>;

export type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    user: true;
    addonSelections: {
      include: {
        addon: true;
      };
    };
    bookingFilters: {
      include: {
        filter: true;
      };
    };
    bookingPremiumFilters: {
      include: {
        premiumFilter: true;
      };
    };
    payment: true;
    tripSegments: true;
  };
}>;

export type TripperWithTiers = Prisma.TripperGetPayload<{
  include: {
    tiers: true;
    blogPosts: true;
  };
}>;

export type AddonWithProvider = Prisma.AddonGetPayload<{
  include: {
    provider: true;
  };
}>;

export type BlogPostWithDetails = Prisma.BlogPostGetPayload<{
  include: {
    tripper: true;
    comments: true;
  };
}>;

// ========================================
// FORM DATA TYPES
// ========================================

export interface CreateUserData {
  email: string;
  name: string;
  avatarUrl?: string;
  travelerType?: string;
  interests?: string[];
  dislikes?: string[];
}

export interface UpdateUserPrefsData {
  travelerType?: string;
  interests?: string[];
  dislikes?: string[];
}

export interface CreateBookingData {
  from: string;
  travelType: string;
  experienceLevel: string;
  origin: string;
  originCity: string;
  startDate: string;
  endDate?: string;
  nights?: number;
  durationNights?: number;
  travelerCount: number;
  destination?: string;
  destinationCountry?: string;
  destinationCity?: string;
  basePrice: number;
  filtersCost: number;
  addonsCost: number;
  totalPrice: number;
  displayPrice: number;
  activeTab?: string;
  selectedAddons?: string[]; // legacy field
}

export interface CreateReviewData {
  rating: number;
  title: string;
  content: string;
  tripType: string;
  destination: string;
}

export interface CreateProviderData {
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
}

export interface CreateAddonData {
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
}

export interface CreateFilterData {
  key: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency?: string;
  icon?: string;
  options?: any[];
}

export interface CreateBlogPostData {
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
}

export interface CreatePaymentData {
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
}

// ========================================
// FILTER TYPES
// ========================================

export interface BookingFilters {
  status?: string[];
  travelType?: string[];
  experienceLevel?: string[];
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface TripperFilters {
  tierLevel?: string[];
  destinations?: string[];
  interests?: string[];
  languages?: string[];
}

// ========================================
// SEARCH PARAMS
// ========================================

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// STATISTICS TYPES
// ========================================

export interface BookingStats {
  total: number;
  byStatus: Record<string, number>;
  byTravelType: Record<string, number>;
  byExperienceLevel: Record<string, number>;
  revenue: {
    total: number;
    average: number;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
  };
}

export interface UserStats {
  total: number;
  active: number;
  newThisMonth: number;
  withBookings: number;
}

// ========================================
// PAGINATION TYPES
// ========================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
