import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { isTripStartDateEligible, validateTripDates } from "@/lib/helpers/tripCalendarDate";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { getCheckoutLevel, getCheckoutPaxDetails } from "@/lib/helpers/checkout-party";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { applyPaxMultiplier } from "@/lib/data/traveler-types";
import { resolveBasePricePerPerson } from "@/lib/pricing/resolve-base-price";
import { loadTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides.server";
import { upsertPaymentForTripCheckout } from "@/lib/db/payment";
import { revertExpiredPendingPayment } from "@/lib/db/tripRequest";
import { evaluatePromoRules, promoErrorCode } from "@/lib/payments/promo-rules";
import { SETTLED_PAYMENT_STATUSES } from "@/lib/payments/settledStatuses";
import {
  maxTopUpCents,
  splitInitialShares,
  type TotalsAtPax,
  type TripDiscount,
  withTripDiscount,
} from "@/lib/payments/split-shares";
import { parseCompanionEmails } from "@/lib/payments/companion-emails";
import type { PaymentMode } from "@prisma/client";
import type { AddonSelection, Filters } from "@/store/slices/journeyStore";
import type { PromoRejectionReason } from "@/types/payments";

const fail = (error: string, status: number, errorCode?: string) =>
  NextResponse.json({ error, ...(errorCode ? { errorCode } : {}) }, { status });

/** Fallback API messages; the checkout UI localizes by `errorCode`. */
const PROMO_RULE_MESSAGES: Record<PromoRejectionReason, string> = {
  already_used: "You have already used this promo code",
  expired: "This promo code has expired",
  first_time_only: "This promo code is only valid on your first purchase",
  max_redemptions_reached: "This promo code has reached its usage limit",
  minimum_amount: "Your trip does not reach this promo code's minimum amount",
};

/** Enforces the promotion code rules Stripe would apply on redemption. Counts
 * exclude this trip so re-quoting a code already applied here never rejects it.
 * Coupon-level `max_redemptions` is not enforced: payments only record the
 * promotion code, not every code that shares the coupon. */
async function checkPromoRules(params: {
  amountCents: number;
  coupon: Stripe.Coupon;
  promotion: Stripe.PromotionCode;
  tripId: string;
  userId: string;
}) {
  const { coupon, promotion, tripId, userId } = params;
  const restrictions: Partial<Stripe.PromotionCode.Restrictions> =
    promotion.restrictions ?? {};
  const settled = {
    status: { in: SETTLED_PAYMENT_STATUSES },
    tripRequestId: { not: tripId },
  };
  const byCode = { ...settled, stripePromotionCodeId: promotion.id };
  const [codeRedemptions, userCodeUses, userSettledPayments] = await Promise.all([
    promotion.max_redemptions != null
      ? prisma.payment.count({ where: byCode })
      : 0,
    prisma.payment.count({ where: { ...byCode, userId } }),
    restrictions.first_time_transaction
      ? prisma.payment.count({ where: { ...settled, userId } })
      : 0,
  ]);
  return evaluatePromoRules({
    amountCents: params.amountCents,
    codeRedemptions,
    coupon: { redeem_by: coupon.redeem_by ?? null },
    currency: "usd",
    nowSeconds: Math.floor(Date.now() / 1000),
    promotion: {
      expires_at: promotion.expires_at ?? null,
      max_redemptions: promotion.max_redemptions ?? null,
      restrictions: {
        currency_options: restrictions.currency_options,
        first_time_transaction: Boolean(restrictions.first_time_transaction),
        minimum_amount: restrictions.minimum_amount ?? null,
        minimum_amount_currency: restrictions.minimum_amount_currency ?? null,
      },
    },
    userCodeUses,
    userSettledPayments,
  });
}

/** One quote path for initial checkout, traveler changes, and promo apply/remove. */
export async function checkoutQuoteResponse(
  request: NextRequest,
  mode: "refresh" | "apply" | "remove" = "refresh",
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Unauthorized", 401);
    let body: {
      tripId?: string;
      promoCode?: string | null;
      paymentMode?: PaymentMode;
      companionEmails?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }
    const { tripId } = body;
    if (!tripId) return fail("tripId is required", 400);
    if (body.promoCode != null && typeof body.promoCode !== "string") {
      return fail("Invalid promo code", 400);
    }
    if (mode === "apply" && !body.promoCode?.trim()) {
      return fail("promoCode is required", 400);
    }
    if (
      body.paymentMode !== undefined &&
      body.paymentMode !== "TOTAL" &&
      body.paymentMode !== "INDIVIDUAL"
    ) {
      return fail("Invalid payment mode", 400);
    }

    let trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: { payment: true, travelers: true },
    });
    if (!trip) return fail("Trip not found", 404);
    if (trip.userId !== session.user.id) return fail("Forbidden", 403);
    const dateError = validateTripDates(trip);
    if (dateError || !isTripStartDateEligible(trip.startDate, trip.type)) {
      return fail(dateError ?? "Departure date is required", 400, "INVALID_TRIP_DATES");
    }
    const status = await revertExpiredPendingPayment(trip);
    if (!["SAVED", "PENDING_PAYMENT"].includes(status))
      return fail("Trip is not in a payable state", 409);
    // Expiry reversion writes updatedAt. Quote the new snapshot, not the version
    // that existed before our own write (the atomic persistence guard uses it).
    if (status !== trip.status) {
      trip = await prisma.tripRequest.findUnique({
        where: { id: tripId },
        include: { payment: true, travelers: true },
      });
      if (!trip) return fail("Trip not found", 404);
      const refreshedDateError = validateTripDates(trip);
      if (refreshedDateError || !isTripStartDateEligible(trip.startDate, trip.type)) {
        return fail(refreshedDateError ?? "Departure date is required", 400, "INVALID_TRIP_DATES");
      }
    }
    if (
      !["SAVED", "PENDING_PAYMENT"].includes(trip.status) ||
      (trip.payment &&
        !(RETRYABLE_PAYMENT_STATUSES as readonly string[]).includes(
          trip.payment.status,
        ))
    ) {
      return fail("Trip is not in a payable state", 409);
    }

    const paxDetails = getCheckoutPaxDetails(trip);
    const pax = paxDetails.adults + paxDetails.minors;
    // Only an explicit INDIVIDUAL request is rejected when the split is
    // invalid; a saved split that no longer fits the party quotes the total.
    let paymentMode: PaymentMode =
      body.paymentMode ?? trip.paymentMode ?? "TOTAL";
    let companionEmails: string[] = [];
    if (paymentMode === "INDIVIDUAL") {
      const explicit = body.paymentMode === "INDIVIDUAL";
      const raw =
        body.companionEmails ??
        (trip.travelers ?? [])
          .filter((t) => t.kind === "ADULT" && t.userId === null)
          .map((t) => t.email);
      const parsed = paxDetails.adults < 2
        ? null
        : parseCompanionEmails(raw, paxDetails.adults - 1, session.user.email);
      if (!parsed && explicit) {
        return paxDetails.adults < 2
          ? fail("Individual payment needs another adult", 400, "INDIVIDUAL_REQUIRES_COMPANIONS")
          : fail("Invalid companion emails", 400, "INVALID_COMPANION_EMAILS");
      }
      if (parsed) companionEmails = parsed;
      else paymentMode = "TOTAL";
    }
    const level = getCheckoutLevel(trip);
    const overrides = await loadTripperPriceOverrides(trip.tripperId);
    const resolution = resolveBasePricePerPerson({
      levelId: level,
      overrides,
      travelerType: trip.type,
    });
    const pricedTrip = trip;
    const totalsAt: TotalsAtPax = (paxAt) => calculatePaymentTotals({
      addons: {
        selected: Array.isArray(trip.addons)
          ? (trip.addons as unknown as AddonSelection[])
          : [],
      },
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd: applyPaxMultiplier(resolution.price, pricedTrip.type, paxAt),
      filters: {
        accommodationType: pricedTrip.accommodationType,
        transport: pricedTrip.transport,
        climate: pricedTrip.climate,
        maxTravelTime: pricedTrip.maxTravelTime,
        departPref: pricedTrip.departPref,
        arrivePref: pricedTrip.arrivePref,
        avoidDestinations: pricedTrip.avoidDestinations,
      } as Filters,
      logistics: {
        pax: paxAt,
        nights: pricedTrip.nights,
        country: pricedTrip.originCountry,
        city: pricedTrip.originCity,
      },
    });
    const totals = totalsAt(pax);
    if (!Number.isFinite(totals.totalTrip) || totals.totalTrip <= 0) {
      return fail("Could not compute payment amount", 422);
    }

    const stripe = getStripe();
    let existing: Stripe.PaymentIntent | null = null;
    if (trip.payment?.stripePaymentIntentId) {
      try {
        existing = await stripe.paymentIntents.retrieve(
          trip.payment.stripePaymentIntentId,
        );
      } catch (error) {
        // An ambiguous failure must never result in a second live intent.
        if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) {
          return fail("Failed to verify existing payment intent", 502);
        }
      }
    }
    if (
      existing &&
      ["processing", "succeeded", "requires_capture"].includes(existing.status)
    ) {
      return fail("Payment already in progress, please retry", 409);
    }

    const code =
      (mode === "remove"
        ? null
        : body.promoCode !== undefined
          ? body.promoCode
          : existing?.metadata?.promoCode
      )
        ?.trim()
        .toUpperCase() || null;
    let discount = 0;
    let tripDiscount: TripDiscount = {};
    let promoCodeId = "";
    if (code) {
      const rejectPromo = async (error: string, errorCode?: string) => {
        // A retained promo that cannot be repriced must not leave an old,
        // discounted intent confirmable from another open checkout tab.
        if (
          existing?.metadata?.promoCode === code &&
          existing.status !== "canceled"
        ) {
          try {
            await stripe.paymentIntents.cancel(existing.id);
          } catch {
            return fail("Payment already in progress, please retry", 409);
          }
        }
        return NextResponse.json(
          { error, code, ...(errorCode ? { errorCode } : {}) },
          { status: 400 },
        );
      };
      const promotion = (
        await stripe.promotionCodes.list({ code, active: true, limit: 1 })
      ).data[0];
      if (!promotion) return rejectPromo("Invalid or expired promo code");
      const ref = promotion.promotion.coupon;
      if (!ref) return rejectPromo("Unsupported promo code");
      const coupon =
        typeof ref === "string"
          ? await stripe.coupons.retrieve(ref)
          : (ref as Stripe.Coupon);
      if (!coupon.valid)
        return rejectPromo("This promo code is no longer valid");
      const rules = await checkPromoRules({
        amountCents: Math.round(totals.totalTrip * 100),
        coupon,
        promotion,
        tripId,
        userId: session.user.id,
      });
      if (!rules.ok)
        return rejectPromo(PROMO_RULE_MESSAGES[rules.reason], promoErrorCode(rules.reason));
      discount = coupon.percent_off
        ? (totals.totalTrip * coupon.percent_off) / 100
        : (coupon.amount_off ?? 0) / 100;
      tripDiscount = coupon.percent_off
        ? { percentOff: coupon.percent_off }
        : { amountOffUsd: (coupon.amount_off ?? 0) / 100 };
      promoCodeId = promotion.id;
    }
    // Preserve the existing paid-checkout minimum; never advertise a free order
    // when Stripe will actually charge USD 0.50.
    const tripAmountCents = Math.max(
      code ? 50 : 0,
      Math.round(
        (totals.totalTrip - Math.min(discount, totals.totalTrip)) * 100,
      ),
    );
    // INDIVIDUAL: the organizer is charged only their share of the discounted trip.
    const party = { invitedTravelerIds: companionEmails, minors: paxDetails.minors };
    const discountedAt = withTripDiscount(totalsAt, tripDiscount);
    // Emails stand in for traveler ids: companion rows are created on persistence.
    const split =
      paymentMode === "INDIVIDUAL" ? splitInitialShares(discountedAt, party) : null;
    const maxTopUp = split ? maxTopUpCents(discountedAt, party) : null;
    const amountCents = split
      ? Math.max(code ? 50 : 0, split.shares[0].amountCents)
      : tripAmountCents;
    const total = amountCents / 100;
    const tripTotal = tripAmountCents / 100;
    const discountAmount = Math.round((totals.totalTrip - tripTotal) * 100) / 100;
    const metadata = {
      tripId,
      userId: session.user.id,
      promoCode: code ?? "",
      promoCodeId,
      discountAmountUsd: String(discountAmount),
      paymentMode,
    };
    const canReuse =
      existing &&
      existing.status !== "canceled" &&
      existing.amount === amountCents &&
      (existing.metadata?.promoCode || null) === code &&
      (existing.metadata?.paymentMode || "TOTAL") === paymentMode &&
      existing.client_secret;
    let intent = existing;
    if (!canReuse) {
      if (existing && existing.status !== "canceled") {
        try {
          await stripe.paymentIntents.cancel(existing.id);
        } catch {
          return fail("Payment already in progress, please retry", 409);
        }
      }
      intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        metadata,
      });
    }
    if (!intent?.client_secret)
      return fail("Failed to obtain payment client secret", 500);

    try {
      await upsertPaymentForTripCheckout({
        userId: session.user.id,
        tripRequestId: tripId,
        provider: "stripe",
        amount: tripTotal,
        currency: "USD",
        stripePaymentIntentId: intent.id,
        expectedTripUpdatedAt: trip.updatedAt,
        paxDetails,
        level,
        previousPayment: trip.payment,
        previousPaymentMode: trip.paymentMode,
        ...(split
          ? {
              split: {
                organizerCents: amountCents,
                companions: split.shares.slice(1).map((s) => ({
                  email: s.travelerId as string,
                  amountCents: s.amountCents,
                })),
              },
            }
          : {}),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      if (!canReuse)
        await stripe.paymentIntents.cancel(intent.id).catch(() => {});
      throw error;
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      code,
      discountAmount,
      total,
      newTotal: total,
      originalTotal: totals.totalTrip,
      totals,
      paxDetails,
      level,
      paymentMode,
      tripTotal,
      ...(split
        ? {
            split: {
              companionEmails,
              companionShare: split.shares[1].amountCents / 100,
              maxTopUp: {
                invitee: (maxTopUp?.inviteeCents ?? 0) / 100,
                organizer: (maxTopUp?.organizerCents ?? 0) / 100,
              },
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("Checkout quote failed:", error);
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 409
        ? 409
        : 500;
    return fail(
      error instanceof Error ? error.message : "Internal server error",
      status,
    );
  }
}
