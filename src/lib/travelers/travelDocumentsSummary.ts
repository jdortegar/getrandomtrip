import { summarizeCompanionDetails } from "./bookingTravelerPolicy";
import { hasTravelDocuments } from "./travelerPolicy";
import type {
  AdminBookingTravelerWithDocuments,
  TravelDocumentsRow,
  TravelDocumentsSummary,
} from "@/types/traveler";

interface TravelDocumentsSubject {
  id: string;
  kind: TravelDocumentsRow["kind"];
  name: string | null;
  nationalities?: readonly string[] | null;
  visas?: readonly string[] | null;
}

function toRow(subject: TravelDocumentsSubject): TravelDocumentsRow {
  return {
    id: subject.id,
    kind: subject.kind,
    name: subject.name,
    nationalities: [...(subject.nationalities ?? [])],
    visas: [...(subject.visas ?? [])],
    missing: !hasTravelDocuments(subject),
  };
}

/**
 * Per-traveler documents for the admin trip view. Every traveler, the buyer
 * and minors included, needs at least one nationality. `expectedTotal` adds
 * booked travelers that have no record yet as missing.
 */
export function summarizeTravelDocuments({
  buyer,
  travelers,
  expectedTotal = 0,
}: {
  buyer: TravelDocumentsSubject | null | undefined;
  travelers: readonly TravelDocumentsSubject[];
  expectedTotal?: number;
}): TravelDocumentsSummary {
  const rows = [...(buyer ? [buyer] : []), ...travelers].map(toRow);
  const unrecorded = Math.max(0, expectedTotal - rows.length);
  return {
    rows,
    missingCount: rows.filter((row) => row.missing).length + unrecorded,
    totalCount: rows.length + unrecorded,
  };
}

/** Splits the admin booking travelers and expects the booked headcount. */
export function summarizeBookingTravelDocuments(
  travelers: readonly AdminBookingTravelerWithDocuments[],
  pax: number,
  paxDetails: unknown,
): TravelDocumentsSummary {
  const buyer = travelers.find((row) => row.kind === "BOOKING_HOLDER");
  const companions = travelers.filter((row) => row.kind !== "BOOKING_HOLDER");
  const { expected } = summarizeCompanionDetails(
    companions.map((row) => ({ ...row, fullName: row.name })),
    pax,
    paxDetails,
  );
  return summarizeTravelDocuments({
    buyer,
    travelers: companions,
    expectedTotal: expected + 1,
  });
}
