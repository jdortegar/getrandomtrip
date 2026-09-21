import type { TripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";

export interface JourneyPricingContext {
  binding: string;
  bookingBound: boolean;
  overrides: TripperPriceOverrides | null;
}

/** Invalidate a rendered quote when its principal, resumed row or product family changes. */
export function journeyPricingKey(
  email: string | null | undefined,
  tripId: string | null | undefined,
  type: string,
) {
  return JSON.stringify([
    email ?? "",
    tripId?.trim() ?? "",
    type === "xsed" ? "xsed" : "journey",
  ]);
}
