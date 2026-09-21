import { prisma } from "@/lib/prisma";
import {
  findActiveTripRequest,
  NON_TERMINAL_TRIP_STATUSES,
  tripFamilyOf,
} from "@/lib/db/tripRequest";
import { loadTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides.server";
import type { TripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";

/** Read-only preview of the attribution POST /api/trip-requests will retain. */
export async function resolveJourneyPricing(input: {
  currentOverrides: TripperPriceOverrides | null;
  tripRequestId?: string;
  type: string;
  userId?: string | null;
}) {
  const { currentOverrides, tripRequestId, type, userId } = input;
  if (tripRequestId && !userId) return null;
  const trip = tripRequestId
    ? await prisma.tripRequest.findFirst({
        where: {
          id: tripRequestId,
          userId: userId!,
          status: { in: [...NON_TERMINAL_TRIP_STATUSES] },
        },
        select: { id: true, tripperId: true },
      })
    : userId
      ? await findActiveTripRequest(userId, tripFamilyOf(type))
      : null;
  // An explicit resume never silently borrows another booking's attribution.
  if (tripRequestId && !trip) return null;
  if (!trip) return { bookingBound: false, overrides: currentOverrides };
  return {
    bookingBound: true,
    // Explicit-id updates retain null too; implicit upsert can stamp the current tripper.
    overrides: trip.tripperId
      ? await loadTripperPriceOverrides(trip.tripperId)
      : tripRequestId
        ? null
        : currentOverrides,
  };
}
