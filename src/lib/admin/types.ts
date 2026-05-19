import type { TripRequestStatus } from './trip-status';

export type { TripRequestStatus };

export type StatusFilterValue = TripRequestStatus | 'ALL';

export interface AdminTripPackage {
  excuseKey: string | null;
  id: string;
  level: string;
  title: string;
  type: string;
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
  package: AdminTripPackage | null;
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
  displayPrice: string;
  id: string;
  isActive: boolean;
  isFeatured: boolean;
  owner: AdminExperienceOwner;
  status: string;
  title: string;
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
  photos: { id: string; url: string; altText: string | null; sortOrder: number }[];
}

export interface AdminXsedExperience {
  id: string;
  slug: string | null;
  status: string;
  titleInternal: string;
  titlePublicTeaser: string | null;
  heroImage: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  originCity: string | null;
  originCountry: string | null;
  distanceKmFromOrigin: number | null;
  tripDate: string | null;
  revealAt: string | null;
  pricePerPerson: number | null;
  currency: string;
  maxSpots: number | null;
  minSpots: number | null;
  costEstimateTotal: number | null;
  /** Percentage 0–100 (e.g. 20 = 20%). */
  targetMarginPercent: number | null;
  included: string | null;
  notIncluded: string | null;
  generalConditions: string | null;
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
