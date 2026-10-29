import type { TripRequest } from "@prisma/client";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { prisma } from "@/lib/prisma";
import type { MyTopUp } from "@/types/payments";

/**
 * The viewer's own unpaid TOP_UP per trip while its grace period is open, or
 * the organizer's unpaid ORGANIZER_REMAINDER (no deadline: due before the
 * reveal). One query for the whole page of trips.
 */
export async function loadMyTopUps(
  trips: Pick<TripRequest, "id" | "status" | "topUpDeadline" | "paymentMode">[],
  userId: string,
  now: Date,
): Promise<Record<string, MyTopUp>> {
  // Only individually paid trips ever owe top-ups; TOTAL trips skip the query.
  const booked = trips.filter(
    (trip) => trip.paymentMode === "INDIVIDUAL" && ["CONFIRMED", "REVEALED"].includes(trip.status),
  );
  if (booked.length === 0) return {};
  const inGrace = (trip: (typeof booked)[number]) =>
    trip.topUpDeadline instanceof Date && trip.topUpDeadline.getTime() > now.getTime();
  const shares = await prisma.paymentShare.findMany({
    where: {
      userId,
      payment: { tripRequestId: { in: booked.map((trip) => trip.id) } },
      OR: [
        { kind: "TOP_UP", status: { in: [...RETRYABLE_PAYMENT_STATUSES] } },
        { kind: "ORGANIZER_REMAINDER", status: { not: "APPROVED" } },
      ],
    },
    select: { id: true, kind: true, amount: true, currency: true, payment: { select: { tripRequestId: true } } },
  });
  const tripsById = new Map(booked.map((trip) => [trip.id, trip]));
  const byTrip: Record<string, MyTopUp> = {};
  for (const share of shares) {
    const trip = tripsById.get(share.payment.tripRequestId);
    if (!trip) continue;
    if (share.kind === "TOP_UP" && !inGrace(trip)) continue;
    // The remainder replaces any top-up on the same trip.
    if (byTrip[trip.id] && share.kind === "TOP_UP") continue;
    byTrip[trip.id] = {
      shareId: share.id,
      amount: share.amount,
      currency: share.currency,
      deadline: share.kind === "TOP_UP" ? (trip.topUpDeadline as Date).toISOString() : null,
    };
  }
  return byTrip;
}
