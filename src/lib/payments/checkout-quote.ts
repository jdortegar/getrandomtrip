import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
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
import type { AddonSelection, Filters } from "@/store/slices/journeyStore";

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/** One quote path for initial checkout, traveler changes, and promo apply/remove. */
export async function checkoutQuoteResponse(
  request: NextRequest,
  mode: "refresh" | "apply" | "remove" = "refresh",
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Unauthorized", 401);
    let body: { tripId?: string; promoCode?: string | null };
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

    let trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: { payment: true },
    });
    if (!trip) return fail("Trip not found", 404);
    if (trip.userId !== session.user.id) return fail("Forbidden", 403);
    const status = await revertExpiredPendingPayment(trip);
    if (!["SAVED", "PENDING_PAYMENT"].includes(status))
      return fail("Trip is not in a payable state", 409);
    // Expiry reversion writes updatedAt. Quote the new snapshot, not the version
    // that existed before our own write (the atomic persistence guard uses it).
    if (status !== trip.status) {
      trip = await prisma.tripRequest.findUnique({
        where: { id: tripId },
        include: { payment: true },
      });
      if (!trip) return fail("Trip not found", 404);
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
    const level = getCheckoutLevel(trip);
    const overrides = await loadTripperPriceOverrides(trip.tripperId);
    const resolution = resolveBasePricePerPerson({
      levelId: level,
      overrides,
      travelerType: trip.type,
    });
    const totals = calculatePaymentTotals({
      addons: {
        selected: Array.isArray(trip.addons)
          ? (trip.addons as unknown as AddonSelection[])
          : [],
      },
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd: applyPaxMultiplier(resolution.price, trip.type, pax),
      filters: {
        accommodationType: trip.accommodationType,
        transport: trip.transport,
        climate: trip.climate,
        maxTravelTime: trip.maxTravelTime,
        departPref: trip.departPref,
        arrivePref: trip.arrivePref,
        avoidDestinations: trip.avoidDestinations,
      } as Filters,
      logistics: {
        pax,
        nights: trip.nights,
        country: trip.originCountry,
        city: trip.originCity,
      },
    });
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
    let promoCodeId = "";
    if (code) {
      const rejectPromo = async (error: string) => {
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
        return NextResponse.json({ error, code }, { status: 400 });
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
      discount = coupon.percent_off
        ? (totals.totalTrip * coupon.percent_off) / 100
        : (coupon.amount_off ?? 0) / 100;
      promoCodeId = promotion.id;
    }
    // Preserve the existing paid-checkout minimum; never advertise a free order
    // when Stripe will actually charge USD 0.50.
    const amountCents = Math.max(
      code ? 50 : 0,
      Math.round(
        (totals.totalTrip - Math.min(discount, totals.totalTrip)) * 100,
      ),
    );
    const total = amountCents / 100;
    const discountAmount = Math.round((totals.totalTrip - total) * 100) / 100;
    const metadata = {
      tripId,
      userId: session.user.id,
      promoCode: code ?? "",
      promoCodeId,
      discountAmountUsd: String(discountAmount),
    };
    const canReuse =
      existing &&
      existing.status !== "canceled" &&
      existing.amount === amountCents &&
      (existing.metadata?.promoCode || null) === code &&
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
        amount: total,
        currency: "USD",
        stripePaymentIntentId: intent.id,
        expectedTripUpdatedAt: trip.updatedAt,
        paxDetails,
        level,
        previousPayment: trip.payment,
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
