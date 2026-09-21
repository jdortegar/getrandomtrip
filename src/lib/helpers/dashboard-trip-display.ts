import { getTripCostDisplay } from "@/lib/helpers/trip-cost-display";
import { getFixedPaxDetailsForTravelType } from "@/lib/helpers/pax-details";
import { getLevelById } from "@/lib/utils/experiencesData";
import { getCardForType } from "@/lib/utils/traveler-card";
import type { Trip } from "@/lib/utils/trips";

function normalizeTripTypeSlug(type: string): string {
  return type.trim().toLowerCase();
}

/** Headcount for catalog totals — matches checkout (solo=1, couple/honeymoon=2, else DB `pax`). */
function effectivePaxForCatalogPricing(trip: Trip): number {
  const travelerType = normalizeTripTypeSlug(trip.type);
  const fixed = getFixedPaxDetailsForTravelType(travelerType);
  if (fixed) {
    return Math.max(1, fixed.adults + fixed.minors);
  }
  return Math.max(1, trip.pax);
}

export function getTripDisplayUsd(trip: Trip): {
  amount: number;
  isEstimate: boolean;
} {
  const result = getTripPriceParts(trip);
  return { amount: result.total, isEstimate: result.isEstimate };
}

/** API attribution drives live estimates; recorded payments drive history. */
export function getTripPriceParts(trip: Trip) {
  const pax =
    trip.payment || trip.basePriceUsd !== undefined
      ? Math.max(1, trip.pax)
      : effectivePaxForCatalogPricing(trip);
  const result = getTripCostDisplay({ ...trip, pax });
  return {
    isEstimate: result.isEstimate,
    pax,
    perPerson: result.perPerson,
    total: result.total,
  };
}

export function getTripExperienceDisplay(
  trip: Trip,
  locale: string,
): {
  levelName: string;
  travelerTypeTitle: string;
  typeImageSrc: string | null;
} {
  const travelerType = normalizeTripTypeSlug(trip.type);
  const card = getCardForType(travelerType, locale);
  const level = getLevelById(travelerType, trip.level, locale);
  return {
    levelName: level?.name ?? trip.level,
    travelerTypeTitle: card?.title ?? travelerType,
    typeImageSrc: card?.img ?? null,
  };
}

/** Short human hint for support (not the full cuid). */
export function formatTripReferenceTail(id: string, visibleChars = 8): string {
  const t = id.trim();
  if (t.length <= visibleChars) return t;
  return `…${t.slice(-visibleChars)}`;
}
