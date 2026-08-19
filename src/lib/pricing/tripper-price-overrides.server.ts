import { prisma } from "@/lib/prisma";
import {
  parseTripperPriceOverrides,
  type TripperPriceOverrides,
} from "./tripper-price-overrides";

/**
 * Loads a tripper's stored price overrides for resolution. `tripperId ===
 * null` means the booking is RandomTrip-owned (no tripper attribution) — the
 * spec requires this to NEVER apply any override, so it short-circuits to
 * `null` with no db hit at all.
 */
export async function loadTripperPriceOverrides(
  tripperId: string | null,
): Promise<TripperPriceOverrides | null> {
  if (!tripperId) return null;

  const tripper = await prisma.user.findUnique({
    select: { tripperPriceOverrides: true },
    where: { id: tripperId },
  });

  return parseTripperPriceOverrides(tripper?.tripperPriceOverrides ?? null);
}

/**
 * Batch variant of {@link loadTripperPriceOverrides} for list endpoints (e.g.
 * `GET /api/trips`) that need overrides for many trips at once — one query
 * instead of one-per-trip. Null/duplicate ids are ignored; ids with no
 * matching tripper or no stored overrides resolve to `null` in the map.
 */
export async function loadTripperPriceOverridesBatch(
  tripperIds: Array<string | null>,
): Promise<Record<string, TripperPriceOverrides | null>> {
  const uniqueIds = Array.from(
    new Set(tripperIds.filter((id): id is string => Boolean(id))),
  );
  if (uniqueIds.length === 0) return {};

  const trippers = await prisma.user.findMany({
    select: { id: true, tripperPriceOverrides: true },
    where: { id: { in: uniqueIds } },
  });

  const result: Record<string, TripperPriceOverrides | null> = {};
  for (const tripper of trippers) {
    result[tripper.id] = parseTripperPriceOverrides(
      tripper.tripperPriceOverrides ?? null,
    );
  }
  return result;
}
