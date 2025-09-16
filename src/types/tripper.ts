export type TripperLevel = 'rookie' | 'pro' | 'elite';

export type RouteStatus = 'draft' | 'in_review' | 'needs_changes' | 'approved' | 'published' | 'archived';

export interface TripperProfile {
  name: string;
  handle: string;
  level: TripperLevel;
  metrics: {
    nps: number;
    routes: number;
    bookings: number;
    revenue: number;
  };
  verification: {
    kycStatus: 'pending' | 'verified' | 'rejected';
    contractSigned: boolean;
  };
  socialNetworks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    // Add more social networks as needed
  };
}

export interface TripperRoute {
  id: string;
  title: string;
  slug: string;
  destinationHints: string[];
  country: string;
  durationNights: number;
  productLevel: TripperLevel; // Assuming product level aligns with tripper level
  pricePerPersonCapUSD: number;
  status: RouteStatus;
  qaScore?: number;
  nps?: number;
  updatedAt: string; // ISO date string
  createdAt: string; // ISO date string
}

export interface Earning {
  id: string;
  month: string; // e.g., "2024-09"
  bookings: number;
  baseCommissionUSD: number;
  bonusUSD: number;
  totalUSD: number;
  status: 'pending' | 'paid' | 'cancelled';
  payoutDate?: string; // ISO date string
}
