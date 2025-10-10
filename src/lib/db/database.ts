import type { Prisma } from '@prisma/client';

// ========================================
// ENHANCED TYPES WITH RELATIONS
// ========================================

export type UserWithTrips = Prisma.UserGetPayload<{
  include: {
    trips: true;
    reviews: true;
  };
}>;

export type TripWithDetails = Prisma.TripGetPayload<{
  include: {
    user: true;
    payment: true;
  };
}>;

// ========================================
// FORM DATA TYPES
// ========================================

export interface CreateUserData {
  email: string;
  name: string;
  password?: string;
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

export interface CreateTripData {
  from?: string;
  type: string;
  level: string;
  country: string;
  city: string;
  startDate?: Date;
  endDate?: Date;
  nights: number;
  pax: number;
  transport?: string;
  climate?: string;
  maxTravelTime?: string;
  departPref?: string;
  arrivePref?: string;
  avoidDestinations?: string[];
  addons?: any;
  basePriceUsd: number;
  displayPrice?: string;
  filtersCostUsd?: number;
  addonsCostUsd?: number;
  totalPerPaxUsd?: number;
  totalTripUsd?: number;
  status?: string;
}

export interface CreateReviewData {
  rating: number;
  title: string;
  content: string;
  tripType: string;
  destination: string;
}

// Legacy model interfaces removed - no longer in schema

export interface CreatePaymentData {
  tripId: string;
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

export interface TripFilters {
  status?: string[];
  type?: string[];
  level?: string[];
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  country?: string;
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

export interface TripStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
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
  withTrips: number;
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
