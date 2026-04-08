import { getBasePricePerPerson } from '@/lib/data/traveler-types';
import type { PaymentTotalsInput } from '@/lib/helpers/payment-totals';
import type { AddonSelection, Filters } from '@/store/slices/journeyStore';

/** Optional fields present on Prisma `TripRequest` list items (dashboard / GET /api/trips). */
export interface TripRequestPricingFields {
  accommodationType?: string;
  addons?: Array<{ id: string; qty: number }> | null;
  arrivePref?: string;
  avoidDestinations?: string[];
  city: string;
  climate?: string;
  country: string;
  departPref?: string;
  level: string;
  maxTravelTime?: string;
  nights?: number;
  pax: number;
  transport?: string;
  type: string;
}

function coercePrefAny(raw: string | undefined): string {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v || v === 'any' || v === 'indistinto') return 'any';
  return String(raw).trim();
}

function coerceMaxTravel(raw: string | undefined): string {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v || v === 'no-limit' || v === 'sin-limite' || v === 'sin_limite') {
    return 'no-limit';
  }
  return String(raw).trim();
}

function coerceTransport(raw: string | undefined): string {
  const v = (raw ?? '').trim().toLowerCase();
  if (!v || v === 'avion') return 'plane';
  return String(raw).trim() || 'plane';
}

/**
 * Builds checkout-identical payment input from a stored trip request row.
 * Used when `totalTripUsd` is not persisted or is zero (unpaid drafts).
 */
export function paymentTotalsInputFromTripRequest(
  trip: TripRequestPricingFields,
): PaymentTotalsInput | null {
  const type = trip.type?.trim().toLowerCase();
  const level = trip.level?.trim();
  if (!type || !level) return null;

  const pax = Math.max(1, trip.pax || 1);
  const basePriceUsd = getBasePricePerPerson(type, level) || 0;

  const avoidList = Array.isArray(trip.avoidDestinations)
    ? trip.avoidDestinations
    : [];

  const filters: Filters = {
    accommodationType: coercePrefAny(trip.accommodationType),
    arrivePref: coercePrefAny(trip.arrivePref),
    avoidDestinations: avoidList,
    climate: coercePrefAny(trip.climate),
    departPref: coercePrefAny(trip.departPref),
    maxTravelTime: coerceMaxTravel(trip.maxTravelTime),
    transport: coerceTransport(trip.transport),
  };

  const addonsSelected: AddonSelection[] =
    trip.addons != null && Array.isArray(trip.addons)
      ? trip.addons.map((a) => ({
          id: String(a.id),
          qty:
            typeof a.qty === 'number' && Number.isFinite(a.qty)
              ? a.qty
              : Number(a.qty) || 1,
        }))
      : [];

  return {
    addons: { selected: addonsSelected },
    avoidCount: avoidList.length,
    basePriceUsd,
    filters,
    logistics: {
      city: trip.city,
      country: trip.country,
      nights: Math.max(1, trip.nights ?? 1),
      pax,
    },
  };
}
