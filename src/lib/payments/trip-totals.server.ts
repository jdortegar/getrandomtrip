import type { TripRequest } from "@prisma/client";
import { applyPaxMultiplier } from "@/lib/data/traveler-types";
import { getCheckoutLevel } from "@/lib/helpers/checkout-party";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { resolveBasePricePerPerson } from "@/lib/pricing/resolve-base-price";
import { loadTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides.server";
import type { TotalsAtPax } from "@/lib/payments/split-shares";
import type { AddonSelection, Filters } from "@/store/slices/journeyStore";

/** Trip columns that decide its price. */
export type PricedTrip = Pick<
  TripRequest,
  | "type" | "level" | "pax" | "paxDetails" | "addons" | "avoidDestinations"
  | "accommodationType" | "transport" | "climate" | "maxTravelTime"
  | "departPref" | "arrivePref" | "nights" | "originCountry" | "originCity"
  | "tripperId"
>;

/** The trip priced at any headcount from its resolved per-person base price. */
export function totalsAtPrice(trip: PricedTrip, basePrice: number): TotalsAtPax {
  return (paxAt) =>
    calculatePaymentTotals({
      addons: {
        selected: Array.isArray(trip.addons)
          ? (trip.addons as unknown as AddonSelection[])
          : [],
      },
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd: applyPaxMultiplier(basePrice, trip.type, paxAt),
      filters: {
        accommodationType: trip.accommodationType,
        transport: trip.transport,
        climate: trip.climate,
        maxTravelTime: trip.maxTravelTime,
        departPref: trip.departPref,
        arrivePref: trip.arrivePref,
        avoidDestinations: trip.avoidDestinations,
      } as Filters,
      logistics: {
        pax: paxAt,
        nights: trip.nights,
        country: trip.originCountry,
        city: trip.originCity,
      },
    });
}

/** Resolves the base price exactly as checkout does, then prices at any headcount. */
export async function loadTripTotalsAt(trip: PricedTrip): Promise<TotalsAtPax> {
  const overrides = await loadTripperPriceOverrides(trip.tripperId);
  const resolution = resolveBasePricePerPerson({
    levelId: getCheckoutLevel(trip),
    overrides,
    travelerType: trip.type,
  });
  return totalsAtPrice(trip, resolution.price);
}
