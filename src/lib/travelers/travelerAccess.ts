import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The ONLY definition of "may read this trip": buyer-owned ∪
 * companion-linked (via a `TripTraveler.userId` claim). Both
 * `GET /api/trip-requests` (list) and `GET /api/trips/[id]` (detail) MUST
 * resolve access through this predicate — never re-express the OR by hand,
 * or the two routes will drift. `DELETE /api/trips/[id]` is intentionally
 * NOT routed through this predicate — it stays buyer-only.
 */
export function tripAccessWhere(userId: string): Prisma.TripRequestWhereInput {
  return { OR: [{ userId }, { travelers: { some: { userId } } }] };
}

/**
 * Single indexed `count` rather than re-expressing the rule in memory —
 * deliberate: a permissions check written twice is a permissions check that
 * will drift.
 */
export async function canAccessTrip(
  tripId: string,
  userId: string,
): Promise<boolean> {
  const count = await prisma.tripRequest.count({
    where: { id: tripId, ...tripAccessWhere(userId) },
  });
  return count > 0;
}

/**
 * Buyer wins if a buyer somehow invites themselves (Prisma dedupes the OR
 * match to a single row either way).
 */
export function tripRoleFor(
  trip: { userId: string },
  userId: string,
): "buyer" | "companion" {
  return trip.userId === userId ? "buyer" : "companion";
}
