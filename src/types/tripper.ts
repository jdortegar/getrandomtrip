// ============================================================================
// Tripper Types - Database Models
// ============================================================================

export type TravellerType =
  | 'solo'
  | 'couple'
  | 'family'
  | 'group'
  | 'honeymoon'
  | 'paws';
export type TierLevel =
  | 'essenza'
  | 'modo-explora'
  | 'explora-plus'
  | 'bivouac'
  | 'atelier-getaway';
export type UserRole = 'CLIENT' | 'TRIPPER' | 'ADMIN';
export type OwnerType = 'CUSTOMER' | 'TRIPPER' | 'ADMIN';
export type RouteStatus =
  | 'draft'
  | 'in_review'
  | 'needs_changes'
  | 'approved'
  | 'published'
  | 'archived';
export type TripperLevel = 'rookie' | 'pro' | 'elite';

// Tripper Route
export interface TripperRoute {
  id: string;
  title: string;
  slug: string;
  destinationHints: string[];
  country: string;
  durationNights: number;
  productLevel: TripperLevel;
  pricePerPersonCapUSD: number;
  status: RouteStatus;
  qaScore?: number;
  nps?: number;
  updatedAt: string;
  createdAt: string;
}

// Tripper Earnings
export interface Earning {
  id: string;
  month: string;
  bookings: number;
  baseCommissionUSD: number;
  bonusUSD: number;
  totalUSD: number;
  status: 'pending' | 'paid';
  payoutDate?: string;
}

// Tripper Profile from Database
export interface TripperProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  tripperSlug: string;
  commission: number;
  availableTypes: string[];
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Featured Trip from Database
export interface FeaturedTrip {
  id: string;
  title: string | null;
  teaser: string | null;
  description: string | null;
  heroImage: string | null;
  type: string;
  level: string;
  highlights: string[];
  tags: string[];
  likes: number;
  nights: number;
  pax: number;
  country: string;
  city: string;
  displayPrice: string;
  ownerId: string | null;
  ownerType: OwnerType;
  isFeatured: boolean;
  isTemplate: boolean;
}

// Simplified Featured Trip for UI
export interface FeaturedTripCard {
  id: string;
  title: string;
  teaser: string;
  heroImage: string;
  type: TravellerType;
  level: TierLevel;
  highlights: string[];
  tags: string[];
  likes: number;
  nights: number;
  pax: number;
  displayPrice: string;
}

// Tripper data for TripperPlanner component
export interface TripperPlannerData {
  tripper: {
    id: string;
    name: string;
    slug: string;
    commission: number;
    availableTypes: TravellerType[];
  };
  featuredTrips: FeaturedTripCard[];
}

// Trip Like
export interface TripLike {
  id: string;
  tripId: string;
  userId: string;
  createdAt: Date;
}
