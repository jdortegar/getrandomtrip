import { Prisma, TripRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Every non-terminal status a `TripRequest` can be in. A row in one of these
 * statuses counts as the user's "active" trip for its family. `CONFIRMED`,
 * `REVEALED`, `COMPLETED`, and `CANCELLED` are terminal and never block a new
 * active slot.
 */
export const NON_TERMINAL_TRIP_STATUSES = [
  TripRequestStatus.DRAFT,
  TripRequestStatus.SAVED,
  TripRequestStatus.PENDING_PAYMENT,
] as const;

/**
 * `TripRequest.type` already has the literal value `"family"` (a journey
 * sub-type). The product-family concept is therefore named `TripFamily` —
 * never bare `family` — to avoid colliding with that field value.
 */
export type TripFamily = "journey" | "xsed";

/**
 * Single source of the family boundary. `xsed` is its own family; every
 * other `type` value (`couple`, `family`, `group`, `solo`, `honeymoon`,
 * `paws`, etc.) is `journey`. Never re-implement `type === "xsed"` inline.
 */
export function tripFamilyOf(type: string | null | undefined): TripFamily {
  return type === "xsed" ? "xsed" : "journey";
}

/** Prisma `where.type` clause for a family. */
export function tripFamilyWhere(family: TripFamily): Prisma.StringFilter | string {
  return family === "xsed" ? "xsed" : { not: "xsed" };
}

export type ExpiryCandidate = {
  id: string;
  status: TripRequestStatus;
  payment?: { expiresAt: Date | null } | null;
};

/**
 * PURE. True only when the row is `PENDING_PAYMENT` and its linked
 * `Payment.expiresAt` is strictly in the past relative to `now`. A missing
 * payment row, a null `expiresAt`, or `expiresAt === now` are all NOT
 * expired — expiry is a strict "past" comparison, not "at or before".
 */
export function isExpiredPendingPayment(
  trip: ExpiryCandidate,
  now: Date = new Date(),
): boolean {
  if (trip.status !== TripRequestStatus.PENDING_PAYMENT) return false;
  const expiresAt = trip.payment?.expiresAt;
  if (!expiresAt) return false;
  return expiresAt.getTime() < now.getTime();
}

/**
 * The ONLY place that writes the expiry revert. Reverts to `SAVED` — never
 * `CANCELLED`. Guarded by a `status: PENDING_PAYMENT` re-check in the
 * `where` so a concurrent webhook flipping the row to `CONFIRMED` wins the
 * race instead of being silently overwritten. No-ops on an empty list.
 */
async function persistRevert(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { count } = await prisma.tripRequest.updateMany({
    where: { id: { in: ids }, status: TripRequestStatus.PENDING_PAYMENT },
    data: { status: TripRequestStatus.SAVED },
  });
  return count;
}

/**
 * Single-row path (payment-intent — trip already loaded with
 * `include: { payment: true }`, so no extra query here). Returns the
 * EFFECTIVE status after any persisted revert.
 */
export async function revertExpiredPendingPayment(
  trip: ExpiryCandidate,
  now: Date = new Date(),
): Promise<TripRequestStatus> {
  if (!isExpiredPendingPayment(trip, now)) return trip.status;
  await persistRevert([trip.id]);
  return TripRequestStatus.SAVED;
}

/**
 * List path (GET /api/trips). Scoped to rows OWNED by `userId` — not
 * companion-linked — so a companion's read never writes to another buyer's
 * trip. Returns the number of rows actually reverted.
 */
export async function revertExpiredPendingPaymentsForUser(
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const candidates = await prisma.tripRequest.findMany({
    where: { userId, status: TripRequestStatus.PENDING_PAYMENT },
    select: { id: true, status: true, payment: { select: { expiresAt: true } } },
  });

  const expiredIds = candidates
    .filter((trip) => isExpiredPendingPayment(trip, now))
    .map((trip) => trip.id);

  if (expiredIds.length === 0) return 0;
  return persistRevert(expiredIds);
}

/**
 * Family-scoped active-row finder. Orders by `updatedAt desc` to match the
 * cleanup script's "keep newest" survivor rule — runtime and cleanup must
 * agree on which row is the active one.
 */
export async function findActiveTripRequest(
  userId: string,
  family: TripFamily,
): Promise<{ id: string; status: TripRequestStatus; tripperId: string | null } | null> {
  return prisma.tripRequest.findFirst({
    where: {
      userId,
      type: tripFamilyWhere(family),
      status: { in: [...NON_TERMINAL_TRIP_STATUSES] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, status: true, tripperId: true },
  });
}
