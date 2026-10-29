import { settleShareFromStripe } from "@/lib/db/paymentShare";
import { getCheckoutLevel } from "@/lib/helpers/checkout-party";
import { normalizeCountryToCode } from "@/lib/helpers/countryCode";
import { loadInviteeMaxTopUp } from "@/lib/payments/invitee-top-up.server";
import { formatPaymentDeadline } from "@/lib/payments/payment-deadline";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type { ShareCheckoutView } from "@/types/payments";

/** Billing prefill from the companion's profile (`User.phone`, `User.address`). */
function profileBilling(phone: string | null | undefined, address: unknown) {
  const a = address && typeof address === "object" ? (address as Record<string, unknown>) : {};
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  return {
    billingPhone: text(phone),
    billingLine1: text(a.street),
    billingCity: text(a.city),
    billingState: text(a.state),
    billingPostalCode: text(a.zipCode),
    billingCountry: normalizeCountryToCode(text(a.country)),
  };
}

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
        user: { select: { email: true, name: true, phone: true, address: true } },
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
    ...profileBilling(traveler.user?.phone, traveler.user?.address),
    trip: {
      type: trip.type,
      level: getCheckoutLevel(trip),
      storedLevel: trip.level,
      excuseKey: trip.excuseKey,
      refineDetails: trip.refineDetails,
      startDate: trip.startDate?.toISOString().slice(0, 10) ?? null,
      nights: trip.nights,
      originCity: trip.originCity,
      originCountry: trip.originCountry,
      transport: trip.transport,
      departPref: trip.departPref,
      arrivePref: trip.arrivePref,
      maxTravelTime: trip.maxTravelTime,
      climate: trip.climate,
      avoidDestinations: trip.avoidDestinations,
      addons: Array.isArray(trip.addons) ? (trip.addons as Array<{ id: string; qty: number }>) : [],
    },
  };
}
