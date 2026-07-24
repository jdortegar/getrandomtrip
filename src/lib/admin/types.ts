import type { TripRequestStatus } from "./trip-status";

export type { TripRequestStatus };

export type StatusFilterValue = TripRequestStatus | "ALL";

export interface AdminTripExperience {
  excuseKey: string[];
  id: string;
  level: string | null;
  title: string;
  type: string[];
}

export interface AdminTripPayment {
  amount: number;
  currency: string;
  status: string;
}

export interface AdminTripUser {
  email: string;
  id: string;
  name: string;
}

export interface AdminTripRequest {
  accommodationType: string;
  actualDestination: string | null;
  addons: unknown;
  arrivePref: string;
  avoidDestinations: string[];
  climate: string;
  completedAt: string | null;
  createdAt: string;
  customerFeedback: string | null;
  customerRating: number | null;
  departPref: string;
  destinationRevealedAt: string | null;
  endDate: string | null;
  experienceId: string | null;
  from: string;
  id: string;
  level: string;
  maxTravelTime: string;
  nights: number;
  originCity: string;
  originCountry: string;
  experience: AdminTripExperience | null;
  pax: number;
  paxDetails: unknown;
  payment: AdminTripPayment | null;
  startDate: string | null;
  status: TripRequestStatus;
  transport: string;
  tripperId: string | null;
  tripPhotos: unknown;
  type: string;
  updatedAt: string;
  user: AdminTripUser;
}

export interface AdminExperienceOwner {
  email: string;
  id: string;
  name: string;
}

export interface AdminExperience {
  createdAt: string;
  id: string;
  isActive: boolean;
  isFeatured: boolean;
  owner: AdminExperienceOwner;
  status: string;
  source: "TRIPPER" | "RANDOMTRIP";
  title: string;
  type: string[];
  level: string | null;
  destinationCountry: string;
  destinationCity: string;
  teaser: string;
  description: string;
  heroImage: string;
  minPax: number;
  maxPax: number;
  minNights: number;
  maxNights: number;
  pricingByType: Record<string, number> | null;
  reviewNote: string | null;
  updatedAt: string;
  // Review copy fields
  isReviewCopy?: boolean;
  parentId?: string | null;
  changedFields?: string[];
  reviewLockedBy?: string | null;
}

export interface AdminBlogAuthor {
  email: string;
  id: string;
  name: string;
}

export interface AdminBlog {
  id: string;
  title: string;
  slug: string | null;
  subtitle: string | null;
  tagline: string | null;
  coverUrl: string | null;
  status: string;
  format: string;
  tags: string[];
  travelType: string | null;
  excuseKey: string | null;
  author: AdminBlogAuthor;
  reviewNote: string | null;
  tripperNote: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  // Review copy fields
  isReviewCopy?: boolean;
  parentId?: string | null;
  changedFields?: string[];
  reviewLockedBy?: string | null;
}

export interface AdminPayment {
  amount: number;
  createdAt: string;
  currency: string;
  id: string;
  provider: string;
  status: string;
  tripRequestId: string;
  user: AdminTripUser;
}

export interface AdminReview {
  content: string;
  createdAt: string;
  destination: string;
  id: string;
  isApproved: boolean;
  isPublic: boolean;
  rating: number;
  title: string;
  tripRequestId: string | null;
  tripperName: string | null;
  user: AdminTripUser;
}

export interface AdminWaitlistEntry {
  createdAt: string;
  email: string;
  id: string;
  inviteStatus?: "invited" | "expired" | null;
  lastName: string | null;
  name: string | null;
}

export interface AdminXsedNotificationEntry {
  createdAt: string;
  email: string;
  id: string;
  locale: string | null;
}

export interface AdminXsedBenefit {
  id: string;
  type: "ACCOMMODATION" | "DINNER" | "ACTIVITY";
  sortOrder: number;
  name: string | null;
  providerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  googleMapsUrl: string | null;
  customerVisibleNotes: string | null;
  internalNotes: string | null;
  confirmationStatus: "PENDING" | "CONFIRMED" | "CANCELLED";
  reservationCode: string | null;
  photos: {
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
  }[];
}

export interface AdminXsedExperience {
  id: string;
  slug: string | null;
  status: string;
  titleInternal: string | null;
  teaser: string;
  heroImage: string;
  destinationCity: string;
  destinationCountry: string;
  tripDate: string | null;
  revealAt: string | null;
  basePrice: number;
  currency: string;
  maxSpots: number | null;
  minSpots: number | null;
  inclusions: unknown;
  exclusions: unknown;
  hotels: unknown;
  activities: unknown;
  cancellationPolicy: string | null;
  weatherPolicy: string | null;
  accessibilityNotes: string | null;
  safetyNotes: string | null;
  revealCopy: string | null;
  preRevealCopy: string | null;
  packingHints: string | null;
  whatsappMessageTemplate: string | null;
  adminNotes: string | null;
  supplierNotes: string | null;
  /** Confirmed bookings count. */
  soldCount: number;
  createdAt: string;
  updatedAt: string;
}
