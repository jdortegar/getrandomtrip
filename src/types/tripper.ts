// ============================================================================
// Tripper Types - Database Models
// ============================================================================

export type TravellerType =
  | "solo"
  | "couple"
  | "family"
  | "group"
  | "honeymoon"
  | "paws";
export type TierLevel =
  | "essenza"
  | "modo-explora"
  | "explora-plus"
  | "bivouac"
  | "atelier-getaway";
export type UserRole = "CLIENT" | "TRIPPER" | "ADMIN";
export type OwnerType = "CUSTOMER" | "TRIPPER" | "ADMIN";
export type RouteStatus =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved"
  | "published"
  | "archived";
export type TripperLevel = "rookie" | "pro" | "elite";

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
  status: "pending" | "paid" | "processing";
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
  nickname?: string;
  tierLevel?: string;
  tripperSlug?: string;
}

/** Editable form shape for the Tripper Settings page identity/profile cards. */
export interface TripperSettingsFormState {
  name: string;
  nickname: string;
  email: string;
  bio: string;
  heroImage: string;
  location: string;
  tierLevel: string;
  destinations: string[];
  tripperSlug: string;
  /** Fraction 0–1 (e.g. 0.15 means 15%). Admin-set, read-only in the UI. */
  commission: number;
  availableTypes: string[];
}

/** Stats shown on the Tripper Settings Hero card. */
export interface TripperSettingsStats {
  totalExperiences: number;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
}

export interface TripperOwnExperienceListItem {
  id: string;
  isActive: boolean;
  status: ExperienceStatus;
  level: string;
  maxNights: number;
  maxPax: number;
  minNights: number;
  minPax: number;
  teaser: string;
  title: string;
  type: string[];
}

/** Public fields returned by listing queries (grids, home, GET /api/trippers). */
export interface TripperListItem {
  id: string;
  name: string;
  tripperSlug: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  commission: number | null;
  travelerType: string | null;
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
  activeExperiences: number;
  totalClients: number;
  /** Percentage value, 0–100 (e.g. 12.5 means 12.5%). */
  conversionRate: number;
}

export interface RecentBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  experienceName: string;
  experienceId?: string;
  date: string;
  amount: number;
  status: "confirmed" | "revealed" | "completed" | "pending" | "cancelled";
  paymentStatus:
    | "APPROVED"
    | "COMPLETED"
    | "PENDING"
    | "FAILED"
    | "REJECTED"
    | "CANCELLED";
}

// ─── Experience Types ─────────────────────────────────────────────────────────

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
  excuseKey: string[];

  // Capacity
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;

  // Pricing
  basePrice: number;
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

  // XSED Drop fields
  titleInternal?: string | null;
  slug?: string | null;
  tripDate?: string | null;
  revealAt?: string | null;
  minSpots?: number | null;
  maxSpots?: number | null;
  currency?: string;
  cancellationPolicy?: string | null;
  weatherPolicy?: string | null;
  accessibilityNotes?: string | null;
  safetyNotes?: string | null;
  revealCopy?: string | null;
  preRevealCopy?: string | null;
  packingHints?: string | null;
  whatsappMessageTemplate?: string | null;
  adminNotes?: string | null;
  supplierNotes?: string | null;
}

// ─── Experience status union (mirrors Prisma enum) ────────────────────────────

export type ExperienceStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PENDING_TRIPPER_REVIEW"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

// ─── New experience form draft ────────────────────────────────────────────────

export interface ItineraryDayEntry {
  title: string;
  description: string;
  image: string | null;
}

export type DurationUnit = "min" | "hr" | "day";

export interface DurationValue {
  value: number;
  unit: DurationUnit;
}

export interface ActivityEntry {
  name: string;
  durationRhythm: DurationValue | null;
  description: string;
  risks: string;
  image: string | null;
}

export interface AccommodationEntry {
  hotelName: string;
  hotelStars: string;
  hotelLocation: string;
  hotelDays: string;
  hotelLink: string;
  referredLink: string;
}

export interface ExperienceFormDraft {
  // About
  status: ExperienceStatus;
  title: string;
  type: string[];
  level: string;
  teaser: string;
  description: string;
  heroImage: string;
  tags: string[];
  // Destination
  destinationCountry: string;
  destinationCity: string;
  excuseKey: string[];
  climate: string;
  // Capacity
  minPax: number;
  maxPax: number;
  minNights: number;
  maxNights: number;
  // Pricing — admin-set on approval, read-only for tripper
  pricingByType?: Record<string, number> | null;
  reviewNote?: string | null;
  estimatedCost: string;
  season: string[];
  // Logistics
  transport: string;
  travelTime: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  accommodationType: string;
  accommodations: AccommodationEntry[];
  // Activities & itinerary
  activities: ActivityEntry[];
  itinerary: ItineraryDayEntry[];
  inclusions: string[];
  exclusions: string[];
  createBlogPost: boolean;
}

export type ExperienceFormDraftOnChange = <K extends keyof ExperienceFormDraft>(
  key: K,
  value: ExperienceFormDraft[K],
) => void;

export interface ExperienceListItem {
  id: string;
  title: string;
  type: string[];
  level: string | null;
  status: ExperienceStatus;
  isActive: boolean;
  pricingByType?: Record<string, number> | null;
  reviewNote?: string | null;
  destinationCountry: string;
  destinationCity: string;
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;
  createdAt: string;
  updatedAt: string;
  // Review copy fields
  isReviewCopy?: boolean;
  parentId?: string | null;
  changedFields?: string[];
  reviewLockedBy?: string | null;
}
