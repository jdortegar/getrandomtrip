import type { TripRequest } from "@prisma/client";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { prisma } from "@/lib/prisma";
import type { MyTopUp } from "@/types/payments";

/**
 * The viewer's own unpaid TOP_UP per trip, for trips still inside their
 * top-up grace period. One query for the whole page of trips.
 */
export async function loadMyTopUps(
  trips: Pick<TripRequest, "id" | "status" | "topUpDeadline">[],
  userId: string,
  now: Date,
): Promise<Record<string, MyTopUp>> {
  const open = trips.filter(
    (trip) =>
      ["CONFIRMED", "REVEALED"].includes(trip.status) &&
      trip.topUpDeadline instanceof Date &&
      trip.topUpDeadline.getTime() > now.getTime(),
  );
  if (open.length === 0) return {};
  const shares = await prisma.paymentShare.findMany({
    where: {
      kind: "TOP_UP",
      userId,
      status: { in: [...RETRYABLE_PAYMENT_STATUSES] },
      payment: { tripRequestId: { in: open.map((trip) => trip.id) } },
    },
    select: { id: true, amount: true, currency: true, payment: { select: { tripRequestId: true } } },
  });
  const deadlines = new Map(open.map((trip) => [trip.id, trip.topUpDeadline as Date]));
  const byTrip: Record<string, MyTopUp> = {};
  for (const share of shares) {
    const tripId = share.payment.tripRequestId;
    byTrip[tripId] = {
      shareId: share.id,
      amount: share.amount,
      currency: share.currency,
      deadline: (deadlines.get(tripId) as Date).toISOString(),
    };
  }
  return byTrip;
}
