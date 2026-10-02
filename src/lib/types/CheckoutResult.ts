import type { TravelerRoster } from "@/types/traveler";

export interface CheckoutResultSummary {
  trip: {
    id: string;
    status: string;
    endDate: string | null;
    level: string;
    nights: number;
    originCity: string;
    originCountry: string;
    pax: number;
    startDate: string | null;
    /** IANA zone the start date is interpreted in; absent/null on legacy trips (Buenos Aires). */
    departureTimeZone?: string | null;
    type: string;
    roster: TravelerRoster;
  };
  payment: {
    amount: number;
    currency: string;
    status: string;
    receiptUrl: string | null;
  };
}
