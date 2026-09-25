import {
  getFixedPaxDetailsForTravelType,
  parsePaxDetails,
  paxDetailsFromTotalPax,
} from "@/lib/helpers/pax-details";

export function getFixedCheckoutParty(type: string, level: string) {
  if (type.trim().toLowerCase() === "xsed") {
    return level.trim().toLowerCase() === "solo"
      ? getFixedPaxDetailsForTravelType("solo")
      : null;
  }
  return getFixedPaxDetailsForTravelType(type);
}

export function getCheckoutPaxDetails(trip: {
  type: string;
  level: string;
  pax: number;
  paxDetails?: unknown;
}) {
  const fixed = getFixedCheckoutParty(trip.type, trip.level);
  if (fixed) return fixed;
  const details = parsePaxDetails(trip.paxDetails);
  return details && details.adults + details.minors === trip.pax
    ? details
    : paxDetailsFromTotalPax(trip.pax);
}

/** XSED stores the travel type in level; one traveler is always Solo. */
export function getCheckoutLevel(trip: {
  type: string;
  level: string;
  pax: number;
  paxDetails?: unknown;
}) {
  const party = getCheckoutPaxDetails(trip);
  return trip.type.trim().toLowerCase() === "xsed" &&
    party.adults + party.minors === 1
    ? "solo"
    : trip.level;
}
