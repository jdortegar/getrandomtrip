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

/** Optional tripper fields on session (JWT / updateSession) or extended user view. */
export interface TripperSessionExtras {
  availableTypes?: string[];
  bio?: string;
  commission?: number;
  destinations?: string[];
  heroImage?: string;
  location?: string;
  tierLevel?: string;
  tripperSlug?: string;
}

export interface TripperOwnExperienceListItem {
  displayPrice: string;
  id: string;
  isActive: boolean;
  level: string;
  maxNights: number;
  maxPax: number;
  minNights: number;
  minPax: number;
  teaser: string;
  title: string;
  type: string;
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
  bio: string | null;
  heroImage: string | null;
  location: string | null;
  tierLevel: string | null;
  destinations: string[];
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

// Tripper Dashboard
export interface TripperDashboardStats {
  totalBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  activePackages: number;
  totalClients: number;
  /** Percentage value, 0–100 (e.g. 12.5 means 12.5%). */
  conversionRate: number;
}

export interface RecentBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  packageName: string;
  packageId?: string;
  date: string;
  amount: number;
  status: 'confirmed' | 'revealed' | 'completed' | 'pending' | 'cancelled';
  paymentStatus: 'APPROVED' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'REJECTED' | 'CANCELLED';
}

// ─── Package Types ────────────────────────────────────────────────────────────

export interface ExperienceHotel {
  name: string;
  stars?: number;
  location?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface ExperienceActivity {
  name: string;
  duration?: string;
  description?: string;
}

export interface ExperienceItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface ExperienceFormData {
  // Identity
  type: string;
  level: string;
  title: string;
  status: string;

  // Display
  teaser: string;
  description: string;
  heroImage: string;

  // Destination
  destinationCountry: string;
  destinationCity: string;
  excuseKey: string;

  // Capacity
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;

  // Pricing
  basePriceUsd: number;
  displayPrice: string;

  // Matching (mirrors TripRequest filters)
  accommodationType: string;
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;

  // Content
  hotels: ExperienceHotel[];
  activities: ExperienceActivity[];
  itinerary: ExperienceItineraryDay[];
  inclusions: string[];
  exclusions: string[];

  // Discovery
  tags: string[];
  highlights: string[];

  // Visibility
  isActive: boolean;
  isFeatured: boolean;
}

export interface ExperienceListItem {
  id: string;
  title: string;
  type: string;
  level: string;  
  status: string;
  isActive: boolean;
  basePriceUsd: number;
  displayPrice: string;
  destinationCountry: string;
  destinationCity: string;
  createdAt: string;
  updatedAt: string;
}
