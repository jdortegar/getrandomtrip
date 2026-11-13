import { getCheckoutPaxDetails } from "@/lib/helpers/checkout-party";
import { prisma } from "@/lib/prisma";
import { maxTopUpCents } from "@/lib/payments/split-shares";
import { loadTripTotalsAt, type PricedTrip } from "@/lib/payments/trip-totals.server";

/**
 * Most a companion of an INDIVIDUAL trip may owe on top of their share if
 * others drop out, in major units. Priced without the promo, which only ever
 * lowers top-ups, so it is a safe "at most" for the disclaimer.
 */
export async function loadInviteeMaxTopUp(trip: PricedTrip & { id: string }): Promise<number> {
  const invitees = await prisma.paymentShare.count({
    where: { payment: { tripRequestId: trip.id }, kind: "SHARE", travelerId: { not: null } },
  });
  if (invitees === 0) return 0;
  const totalsAt = await loadTripTotalsAt(trip);
  const party = {
    invitedTravelerIds: Array.from({ length: invitees }, (_, i) => `companion-${i}`),
    minors: getCheckoutPaxDetails(trip).minors,
  };
  return maxTopUpCents(totalsAt, party).inviteeCents / 100;
}
