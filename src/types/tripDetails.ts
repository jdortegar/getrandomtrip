import type { ItineraryDayEntry } from "@/types/tripper";
import type { TripDocumentDTO } from "@/types/tripDocument";

/**
 * The widened shape the traveler trip-details page consumes. `GET
 * /api/trips/[id]` already returns every `TripRequest` scalar plus a
 * `select`ed `experience` (design.md ADR-6) — this type simply gives the
 * client a name for what was already on the wire and discarded.
 *
 * Prisma `DateTime` fields serialize to ISO strings through
 * `NextResponse.json`, so every date field here is `string | null`, never
 * `Date`.
 */
export interface TripDetailsData {
  id: string;
  /** `TripRequestStatus` enum value, string per the API's JSON serialization. */
  status: string;
  startDate: string | null;
  /** IANA zone the start date is interpreted in; absent/null on legacy trips (Buenos Aires). */
  departureTimeZone?: string | null;
  endDate: string | null;
  nights: number;
  pax: number;
  /** `'solo' | 'couple' | 'family' | 'group' | 'honeymoon' | 'paws'`. */
  type: string;
  originCity: string;
  originCountry: string;
  actualDestination: string | null;
  destinationRevealedAt: string | null;
  experience?: {
    id: string;
    title: string;
    heroImage: string | null;
    destinationCity: string | null;
    destinationCountry: string | null;
    /** Short destination description; only sent once the trip is revealed. */
    teaser?: string | null;
    /** Full experience description; only sent once the trip is revealed. */
    description?: string | null;
    /** First stay's display name (never the hotel record); only sent once revealed. */
    hotelName?: string | null;
    /** Destination photo URLs (gallery, XSED sections, activities); only sent once revealed. */
    photos?: string[];
    itinerary: ItineraryDayEntry[] | null;
    inclusions: unknown[] | null;
    exclusions: unknown[] | null;
  } | null;
  /** Absent (not empty) when the server's fulfillment gate hid it (ADR-7). */
  documents?: TripDocumentDTO[];
}

/** One label/value row in the trip-details "Your trip" summary (already localized). */
export interface TripSetupItem {
  label: string;
  value: string;
}

/** Lifecycle milestones shown in the trip-details timeline, in order. */
export type TripTimelineStepKey =
  | "created"
  | "paid"
  | "revealed"
  | "departure"
  | "completed"
  | "cancelled";

/** `current` is the first step not reached yet — what the traveler waits on. */
export type TripTimelineStepState = "done" | "current" | "upcoming";

export interface TripTimelineStep {
  key: TripTimelineStepKey;
  state: TripTimelineStepState;
  /** ISO timestamp: when it happened, or the planned date for an upcoming step; null when unknown. */
  date: string | null;
  /** True for calendar-date fields (start/end) that must be formatted in UTC to avoid a day shift. */
  dateOnly?: boolean;
}
