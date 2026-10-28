import { settleShareFromStripe } from "@/lib/db/paymentShare";
import { loadInviteeMaxTopUp } from "@/lib/payments/invitee-top-up.server";
import { formatPaymentDeadline } from "@/lib/payments/payment-deadline";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type { ShareCheckoutView } from "@/types/payments";

/**
 * Resolves the signed-in companion's share for the share checkout page, or
 * null when the row is not theirs or has no share. Returning from Stripe with
 * `paymentIntentId` settles the share at once if Stripe confirms it, so the
 * page does not wait on the webhook (which settles it the same way).
 */
export async function loadShareCheckout(
  travelerId: string,
  userId: string,
  locale: "es" | "en",
  paymentIntentId?: string,
): Promise<ShareCheckoutView | null> {
  const load = () =>
    prisma.tripTraveler.findUnique({
      where: { id: travelerId },
      include: {
        tripRequest: { include: { user: { select: { name: true } } } },
        paymentShares: { where: { kind: "SHARE" } },
        user: { select: { email: true, name: true } },
      },
    });
  let traveler = await load();
  if (!traveler || traveler.userId !== userId) return null;
  let share = traveler.paymentShares[0];
  if (!share) return null;

  if (paymentIntentId && share.status !== "APPROVED" && share.stripePaymentIntentId === paymentIntentId) {
    try {
      const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
      if (intent.status === "succeeded" && intent.metadata?.shareId === share.id) {
        await settleShareFromStripe(intent.id, "APPROVED", new Date(intent.created * 1000));
        traveler = (await load()) ?? traveler;
        share = traveler.paymentShares[0] ?? share;
      }
    } catch (error) {
      // The webhook settles it anyway; the page shows the current state.
      console.error("[share-checkout] return confirmation unavailable:", error);
    }
  }

  const trip = traveler.tripRequest;
  const open =
    trip.paymentMode === "INDIVIDUAL" &&
    trip.status === "COLLECTING" &&
    !!trip.paymentDeadline &&
    trip.paymentDeadline.getTime() > Date.now();
  const state = share.status === "APPROVED" ? "paid" : open ? "pay" : "closed";
  return {
    travelerId: traveler.id,
    state,
    amount: share.amount,
    currency: share.currency,
    paymentDeadlineLabel: trip.paymentDeadline
      ? formatPaymentDeadline(trip.paymentDeadline, locale, trip.departureTimeZone)
      : null,
    maxTopUp: state === "pay" ? await loadInviteeMaxTopUp(trip) : 0,
    organizerFirstName: trip.user.name?.split(" ")[0] ?? "",
    billingEmail: traveler.user?.email ?? traveler.email ?? "",
    billingName: traveler.user?.name ?? traveler.fullName ?? "",
    trip: {
      type: trip.type,
      level: trip.level,
      originCity: trip.originCity,
      originCountry: trip.originCountry,
      startDate: trip.startDate?.toISOString().slice(0, 10) ?? null,
      nights: trip.nights,
    },
  };
}
