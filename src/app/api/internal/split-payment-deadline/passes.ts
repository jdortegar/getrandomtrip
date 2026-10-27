import Stripe from "stripe";
import { inviteSplitCompanions } from "@/lib/db/payment";
import { settleShareFromStripe } from "@/lib/db/paymentShare";
import { runSaleNotificationBatch } from "@/lib/db/runSaleNotificationBatch";
import {
  deliverTopUpDueEmail,
  sendAdminNewBooking,
  sendBookingConfirmed,
  sendTopUpDueEmail,
} from "@/lib/email";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
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

export interface TopUpReminderResult {
  reminded: number;
  failed: number;
}

/** Reminders go out in the last day of the top-up grace period. */
export const TOP_UP_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

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
    if (promoted.count !== 1) return { confirmed: false, saleQueued: false, topUpIds: [] as string[] };
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
    const topUpIds: string[] = [];
    for (const topUp of topUps) {
      if (topUp.amountCents <= 0) continue;
      const companion = companions.find((s) => s.travelerId === topUp.travelerId);
      const created = await tx.paymentShare.create({
        data: {
          paymentId: payment.id,
          travelerId: topUp.travelerId,
          userId: topUp.travelerId === null ? trip.userId : companion?.userId ?? null,
          kind: "TOP_UP",
          amount: topUp.amountCents / 100,
          currency: payment.currency,
        },
      });
      topUpIds.push(created.id);
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
    return { confirmed: true, saleQueued: Boolean(saleIntentId), topUpIds };
  });
  if (!outcome.confirmed) return false;

  // External side effects only after commit and only for the winning run.
  sendBookingConfirmed(trip.id, trip.userId);
  sendAdminNewBooking(trip.id, trip.userId);
  for (const id of outcome.topUpIds) sendTopUpDueEmail(id);
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

/**
 * One reminder per unpaid top-up in the last day of its grace period. The
 * stamp is written only after the provider accepted the email, so a failed
 * send is retried next run.
 */
export async function runTopUpReminderPass(
  now: Date,
  options: { tripId?: string } = {},
): Promise<TopUpReminderResult> {
  const due = await prisma.paymentShare.findMany({
    where: {
      kind: "TOP_UP",
      reminderSentAt: null,
      status: { in: [...RETRYABLE_PAYMENT_STATUSES] },
      payment: {
        tripRequest: {
          ...(options.tripId ? { id: options.tripId } : {}),
          status: { in: ["CONFIRMED", "REVEALED"] },
          topUpDeadline: { gt: now, lte: new Date(now.getTime() + TOP_UP_REMINDER_WINDOW_MS) },
        },
      },
    },
    select: { id: true },
  });
  const result: TopUpReminderResult = { reminded: 0, failed: 0 };
  for (const { id } of due) {
    try {
      await deliverTopUpDueEmail(id, true);
      await prisma.paymentShare.updateMany({
        where: { id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      result.reminded++;
    } catch (error) {
      result.failed++;
      console.error("[split-deadline] top-up reminder not sent; retrying next run:", id, error);
    }
  }
  return result;
}

export interface RemainderPassResult {
  closed: number;
  remainders: number;
  failed: number;
}

/**
 * Closes one trip's top-up grace period: open top-up intents are settled or
 * cancelled, unpaid top-ups are folded into one ORGANIZER_REMAINDER share and
 * the organizer is emailed. Clearing `topUpDeadline` claims the trip, so only
 * one run ever folds it. Returns the remainder id, or null when nothing was owed.
 */
export async function closeTopUpGrace(tripId: string): Promise<{ closed: boolean; remainderId: string | null }> {
  const load = () =>
    prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: { payment: { include: { shares: true } } },
    });
  const before = await load();
  if (!before?.payment || !before.topUpDeadline) return { closed: false, remainderId: null };
  const owed = (s: { kind: string; status: string }) =>
    s.kind === "TOP_UP" && (RETRYABLE_PAYMENT_STATUSES as readonly string[]).includes(s.status);
  const openTopUpIntents = (shares: typeof before.payment.shares) =>
    shares.filter((s) => owed(s) && s.stripePaymentIntentId).map((s) => s.stripePaymentIntentId as string);
  const closed = openTopUpIntents(before.payment.shares);
  await closeShareIntents(closed);

  const trip = await load();
  if (!trip?.payment || !trip.topUpDeadline) return { closed: false, remainderId: null };
  // An intent claimed while the first pass ran is closed too; if it settled,
  // the in-transaction fold count sends this trip to the next run.
  await closeShareIntents(openTopUpIntents(trip.payment.shares).filter((id) => !closed.includes(id)));
  const payment = trip.payment;
  // Only top-ups still owed are folded; refunded or disputed ones never are.
  const unpaid = payment.shares.filter(owed);
  const remainderCents = unpaid.reduce((sum, s) => sum + Math.round(s.amount * 100), 0);

  const remainderId = await prisma.$transaction(async (tx) => {
    const claimed = await tx.tripRequest.updateMany({
      where: { id: trip.id, topUpDeadline: trip.topUpDeadline },
      data: { topUpDeadline: null },
    });
    if (claimed.count !== 1) return undefined;
    if (unpaid.length === 0) return null;
    // A top-up paid after our read must not also be charged to the organizer.
    const folded = await tx.paymentShare.updateMany({
      where: { id: { in: unpaid.map((s) => s.id) }, status: { in: [...RETRYABLE_PAYMENT_STATUSES] } },
      data: { status: "CANCELLED" },
    });
    if (folded.count !== unpaid.length) throw new Error("Top-ups changed while closing the grace period");
    const remainder = await tx.paymentShare.create({
      data: {
        paymentId: payment.id,
        travelerId: null,
        userId: trip.userId,
        kind: "ORGANIZER_REMAINDER",
        amount: remainderCents / 100,
        currency: payment.currency,
      },
    });
    return remainder.id;
  });
  if (remainderId === undefined) return { closed: false, remainderId: null };
  if (remainderId) sendTopUpDueEmail(remainderId);
  return { closed: true, remainderId };
}

/** Folds unpaid top-ups into the organizer's remainder once a grace period ends. */
export async function runRemainderPass(now: Date): Promise<RemainderPassResult> {
  const due = await prisma.tripRequest.findMany({
    where: {
      paymentMode: "INDIVIDUAL",
      status: { in: ["CONFIRMED", "REVEALED"] },
      topUpDeadline: { lte: now },
    },
    select: { id: true },
  });
  const result: RemainderPassResult = { closed: 0, remainders: 0, failed: 0 };
  for (const { id } of due) {
    try {
      const outcome = await closeTopUpGrace(id);
      if (outcome.closed) result.closed++;
      if (outcome.remainderId) result.remainders++;
    } catch (error) {
      result.failed++;
      console.error("[split-deadline] grace period not closed; retrying next run:", id, error);
    }
  }
  return result;
}
