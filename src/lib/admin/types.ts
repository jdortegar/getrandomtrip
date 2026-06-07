import type { TripRequestStatus } from "./trip-status";

export type { TripRequestStatus };

export type StatusFilterValue = TripRequestStatus | "ALL";

export interface AdminTripExperience {
  excuseKey: string | null;
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
  createdAt: string;
  destination: string;
  id: string;
  isApproved: boolean;
  isPublic: boolean;
  rating: number;
  title: string;
  user: AdminTripUser;
}

export interface AdminWaitlistEntry {
  createdAt: string;
  email: string;
  id: string;
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
