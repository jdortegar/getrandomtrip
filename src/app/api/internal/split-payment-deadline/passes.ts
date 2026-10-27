import Stripe from "stripe";
import { inviteSplitCompanions } from "@/lib/db/payment";
import { settleShareFromStripe } from "@/lib/db/paymentShare";
import { runSaleNotificationBatch } from "@/lib/db/runSaleNotificationBatch";
import { sendAdminNewBooking, sendBookingConfirmed } from "@/lib/email";
import { getCheckoutPaxDetails } from "@/lib/helpers/checkout-party";
import {
  splitTopUps,
  TOP_UP_GRACE_MS,
  type TripDiscount,
  withTripDiscount,
} from "@/lib/payments/split-shares";
import { loadTripTotalsAt } from "@/lib/payments/trip-totals.server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export interface DeadlinePassResult {
  confirmed: number;
  skipped: number;
  failed: number;
}

export interface ReinvitePassResult {
  trips: number;
}

const changedDuringClose = new Error("Shares changed while closing collection");

/** Stripe statuses where the intent can still be paid, so it must be cancelled. */
const CANCELLABLE = ["requires_payment_method", "requires_confirmation", "requires_action"];

/**
 * Closes every open companion share intent. An intent Stripe already charged
 * settles its share instead: that companion paid before the deadline even if
 * the webhook has not arrived yet.
 */
async function closeShareIntents(intentIds: string[]) {
  const stripe = getStripe();
  for (const id of intentIds) {
    const intent = await stripe.paymentIntents.retrieve(id);
    if (intent.status === "succeeded") {
      await settleShareFromStripe(id, "APPROVED", new Date(intent.created * 1000));
    } else if (intent.status === "processing") {
      // Retry next hour, once Stripe has decided.
      throw new Error(`Share intent ${id} is still processing`);
    } else if (CANCELLABLE.includes(intent.status)) {
      await stripe.paymentIntents.cancel(id);
    }
  }
}

/** The organizer's promo, read back from Stripe so top-ups stay discounted. */
async function loadTripDiscount(promotionCodeId: string | null): Promise<TripDiscount> {
  if (!promotionCodeId) return {};
  const stripe = getStripe();
  const promotion = await stripe.promotionCodes.retrieve(promotionCodeId);
  const ref = promotion.promotion.coupon;
  if (!ref) return {};
  const coupon = typeof ref === "string" ? await stripe.coupons.retrieve(ref) : (ref as Stripe.Coupon);
  if (coupon.percent_off) return { percentOff: coupon.percent_off };
  return coupon.amount_off ? { amountOffUsd: coupon.amount_off / 100 } : {};
}

/**
 * Confirms one trip whose collection deadline passed. Companions who paid
 * travel; the rest are dropped, per-trip costs are re-split into TOP_UP shares
 * and the booking emails and sale notification deferred at settlement go out.
 * Returns false when another run already confirmed it.
 */
export async function confirmCollectedTrip(tripId: string, now: Date): Promise<boolean> {
  const load = () =>
    prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: { payment: { include: { shares: true } } },
    });
  const before = await load();
  if (!before?.payment || before.status !== "COLLECTING") return false;

  const openIntents = (shares: typeof before.payment.shares) =>
    shares
      .filter((s) => s.kind === "SHARE" && s.travelerId !== null && s.status !== "APPROVED" && s.stripePaymentIntentId)
      .map((s) => s.stripePaymentIntentId as string);
  const closed = openIntents(before.payment.shares);
  await closeShareIntents(closed);

  const trip = await load();
  if (!trip?.payment || trip.status !== "COLLECTING") return false;
  // An intent claimed while the first pass ran is closed too; if it settled,
  // the in-transaction count check sends this trip to the next run.
  await closeShareIntents(openIntents(trip.payment.shares).filter((id) => !closed.includes(id)));
  const payment = trip.payment;
  const companions = payment.shares.filter((s) => s.kind === "SHARE" && s.travelerId !== null);
  const paidIds = companions.filter((s) => s.status === "APPROVED").map((s) => s.travelerId as string);
  const unpaid = companions.filter((s) => s.status !== "APPROVED");

  const details = getCheckoutPaxDetails(trip);
  const totalsAt = withTripDiscount(
    await loadTripTotalsAt(trip),
    await loadTripDiscount(payment.stripePromotionCodeId),
  );
  const party = {
    invitedTravelerIds: companions.map((s) => s.travelerId as string),
    minors: details.minors,
  };
  const { pax, totalCents, topUps } = splitTopUps(totalsAt, party, paidIds);
  // Top-ups never go negative, so payers can have paid more than the smaller
  // trip now costs (e.g. PAWS losing its multiplier, a fixed promo over fewer
  // people). The bill records what was actually collected.
  const toCents = (amount: number) => Math.round(amount * 100);
  const paidCents = payment.shares
    .filter((s) => s.kind === "SHARE" && s.status === "APPROVED" &&
      (s.travelerId === null ? s.userId === trip.userId : paidIds.includes(s.travelerId)))
    .reduce((sum, s) => sum + toCents(s.amount), 0);
  const topUpCents = topUps.reduce((sum, t) => sum + Math.max(0, t.amountCents), 0);
  const billCents = Math.max(totalCents, paidCents + topUpCents);
  if (billCents > totalCents) {
    // Product decision: keep the extra and refund by hand, so ops can find it here.
    console.warn("[split-deadline] collected more than the trip now costs; refund by hand if due", {
      tripId: trip.id,
      collected: billCents / 100,
      tripTotal: totalCents / 100,
      currency: payment.currency,
    });
  }
  const adults = 1 + paidIds.length;
  const paxDetails = { ...details, adults, rooms: Math.min(details.rooms, pax) };
  // Live mode comes from Stripe: the stored event is empty when the organizer
  // was settled by the confirm-payment fallback.
  const organizerIntent = payment.stripePaymentIntentId
    ? await getStripe().paymentIntents.retrieve(payment.stripePaymentIntentId)
    : null;
  const saleIntentId = organizerIntent?.livemode === true ? organizerIntent.id : null;

  const outcome = await prisma.$transaction(async (tx) => {
    const promoted = await tx.tripRequest.updateMany({
      where: { id: trip.id, status: "COLLECTING" },
      data: {
        status: "CONFIRMED",
        pax,
        paxDetails,
        topUpDeadline: new Date(now.getTime() + TOP_UP_GRACE_MS),
      },
    });
    if (promoted.count !== 1) return { confirmed: false, saleQueued: false };
    // A late webhook between pricing and this write would change who travels.
    const settledNow = await tx.paymentShare.count({
      where: { paymentId: payment.id, kind: "SHARE", travelerId: { not: null }, status: "APPROVED" },
    });
    if (settledNow !== paidIds.length) throw changedDuringClose;

    if (unpaid.length > 0) {
      await tx.paymentShare.updateMany({
        where: { id: { in: unpaid.map((s) => s.id) } },
        data: { status: "CANCELLED" },
      });
      // Unpaid companions don't travel, whether or not they accepted the invite.
      await tx.tripTraveler.deleteMany({
        where: { id: { in: unpaid.map((s) => s.travelerId as string) } },
      });
    }
    await tx.payment.update({ where: { id: payment.id }, data: { amount: billCents / 100 } });
    for (const topUp of topUps) {
      if (topUp.amountCents <= 0) continue;
      const companion = companions.find((s) => s.travelerId === topUp.travelerId);
      await tx.paymentShare.create({
        data: {
          paymentId: payment.id,
          travelerId: topUp.travelerId,
          userId: topUp.travelerId === null ? trip.userId : companion?.userId ?? null,
          kind: "TOP_UP",
          amount: topUp.amountCents / 100,
          currency: payment.currency,
        },
      });
    }
    if (saleIntentId) {
      await tx.saleNotificationDelivery.create({
        data: {
          paymentId: payment.id,
          stripePaymentIntentId: saleIntentId,
          tripRequestId: trip.id,
          amount: billCents / 100,
          currency: payment.currency,
        },
      });
    }
    return { confirmed: true, saleQueued: Boolean(saleIntentId) };
  });
  if (!outcome.confirmed) return false;

  // External side effects only after commit and only for the winning run.
  sendBookingConfirmed(trip.id, trip.userId);
  sendAdminNewBooking(trip.id, trip.userId);
  if (outcome.saleQueued) {
    await runSaleNotificationBatch(payment.id).catch(() => {
      console.error("[split-deadline] immediate sale delivery unavailable; queued for retry");
    });
  }
  return true;
}

/** Confirms every INDIVIDUAL trip whose collection deadline has passed. */
export async function runDeadlinePass(now: Date): Promise<DeadlinePassResult> {
  const due = await prisma.tripRequest.findMany({
    where: { paymentMode: "INDIVIDUAL", status: "COLLECTING", paymentDeadline: { lte: now } },
    select: { id: true },
  });
  const result: DeadlinePassResult = { confirmed: 0, skipped: 0, failed: 0 };
  for (const { id } of due) {
    try {
      if (await confirmCollectedTrip(id, now)) result.confirmed++;
      else result.skipped++;
    } catch (error) {
      result.failed++;
      console.error("[split-deadline] trip not confirmed; retrying next run:", id, error);
    }
  }
  return result;
}

/**
 * Re-sends invites that never went out while a trip is still collecting
 * (invite delivery at settlement is best-effort).
 */
export async function runReinvitePass(now: Date): Promise<ReinvitePassResult> {
  const trips = await prisma.tripRequest.findMany({
    where: {
      paymentMode: "INDIVIDUAL",
      status: "COLLECTING",
      paymentDeadline: { gt: now },
      travelers: { some: { kind: "ADULT", status: "PENDING", userId: null, email: { not: null } } },
    },
    select: { id: true },
  });
  for (const { id } of trips) {
    try {
      await inviteSplitCompanions(id);
    } catch (error) {
      console.error("[split-deadline] re-invite failed; retrying next run:", id, error);
    }
  }
  return { trips: trips.length };
}
