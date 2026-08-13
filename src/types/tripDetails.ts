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
    itinerary: ItineraryDayEntry[] | null;
    inclusions: unknown[] | null;
    exclusions: unknown[] | null;
  } | null;
  /** Absent (not empty) when the server's fulfillment gate hid it (ADR-7). */
  documents?: TripDocumentDTO[];
}
