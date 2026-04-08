import { getPricePerPerson } from '@/lib/data/traveler-types';
import { calculatePaymentTotals } from '@/lib/helpers/payment-totals';
import { paymentTotalsInputFromTripRequest } from '@/lib/helpers/trip-request-pricing';
import { getFixedPaxDetailsForTravelType } from '@/lib/helpers/pax-details';
import { getLevelById } from '@/lib/utils/experiencesData';
import { getCardForType } from '@/lib/utils/traveler-card';
import type { Trip } from '@/lib/utils/trips';

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

export function getTripDisplayUsd(trip: Trip): { amount: number; isEstimate: boolean } {
  if (trip.totalTripUsd > 0) {
    return { amount: trip.totalTripUsd, isEstimate: false };
  }
  const pax = effectivePaxForCatalogPricing(trip);
  const travelerType = normalizeTripTypeSlug(trip.type);
  const per = getPricePerPerson(travelerType, trip.level, pax);
  if (per <= 0) return { amount: 0, isEstimate: true };
  return { amount: per * pax, isEstimate: true };
}

/** Per-person and total for display (aligned with checkout / usePayment). */
export function getTripPriceParts(trip: Trip): {
  isEstimate: boolean;
  pax: number;
  perPerson: number;
  total: number;
} {
  const pax = effectivePaxForCatalogPricing(trip);
  const travelerType = normalizeTripTypeSlug(trip.type);
  if (trip.totalTripUsd > 0) {
    const per = Math.max(0, Math.round(trip.totalTripUsd / pax));
    return {
      isEstimate: false,
      pax,
      perPerson: per,
      total: Math.round(trip.totalTripUsd),
    };
  }

  const paymentInput = paymentTotalsInputFromTripRequest({
    accommodationType: trip.accommodationType,
    addons: trip.addons ?? null,
    arrivePref: trip.arrivePref,
    avoidDestinations: trip.avoidDestinations,
    city: trip.city,
    climate: trip.climate,
    country: trip.country,
    departPref: trip.departPref,
    level: trip.level,
    maxTravelTime: trip.maxTravelTime,
    nights: trip.nights,
    pax,
    transport: trip.transport,
    type: trip.type,
  });

  if (paymentInput) {
    const t = calculatePaymentTotals(paymentInput);
    return {
      isEstimate: true,
      pax: paymentInput.logistics.pax,
      perPerson: Math.round(t.totalPerPax),
      total: Math.round(t.totalTrip),
    };
  }

  const per = getPricePerPerson(travelerType, trip.level, pax);
  const total = per * pax;
  return {
    isEstimate: true,
    pax,
    perPerson: per,
    total,
  };
}

export function getTripExperienceDisplay(
  trip: Trip,
  locale: string,
): { levelName: string; travelerTypeTitle: string; typeImageSrc: string | null } {
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
