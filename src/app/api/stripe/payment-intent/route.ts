import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStripe } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { getPricePerPerson } from "@/lib/data/traveler-types";
import { upsertPaymentForTripCheckout } from "@/lib/db/payment";
import { revertExpiredPendingPayment } from "@/lib/db/tripRequest";
import type {
  AddonSelection,
  Filters,
  Logistics,
} from "@/store/slices/journeyStore";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tripId: string;
    try {
      ({ tripId } = await request.json());
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!tripId) {
      return NextResponse.json(
        { error: "tripId is required" },
        { status: 400 },
      );
    }

    // Fetch trip and verify ownership
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: { payment: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Normalize a stale PENDING_PAYMENT (expired Payment.expiresAt) back to
    // SAVED before deciding payability — an expired row is still payable,
    // it just shouldn't masquerade as an in-flight checkout.
    const effectiveStatus = await revertExpiredPendingPayment(trip);

    const PAYABLE_STATUSES = ["SAVED", "PENDING_PAYMENT"] as const;
    if (
      !PAYABLE_STATUSES.includes(
        effectiveStatus as "SAVED" | "PENDING_PAYMENT",
      )
    ) {
      return NextResponse.json(
        { error: "Trip is not in a payable state" },
        { status: 409 },
      );
    }

    if (effectiveStatus !== "PENDING_PAYMENT") {
      await prisma.tripRequest.update({
        where: { id: tripId },
        data: { status: "PENDING_PAYMENT" },
      });
    }

    // Compute amount server-side. Hoisted ABOVE the idempotency branch so
    // the amount-guard comparison below has a fresh `amountCents` to check
    // the existing intent against — a family-scoped active row can be
    // reconfigured while a live PaymentIntent still points at the old
    // amount, and the idempotency short-circuit must not paper over that.
    const basePriceUsd = getPricePerPerson(trip.type, trip.level, trip.pax);

    const addonsRaw = Array.isArray(trip.addons)
      ? (trip.addons as unknown as AddonSelection[])
      : [];
    const filters: Filters = {
      accommodationType: trip.accommodationType as Filters["accommodationType"],
      transport: trip.transport as Filters["transport"],
      climate: trip.climate as Filters["climate"],
      maxTravelTime: trip.maxTravelTime as Filters["maxTravelTime"],
      departPref: trip.departPref as Filters["departPref"],
      arrivePref: trip.arrivePref as Filters["arrivePref"],
      avoidDestinations: trip.avoidDestinations,
    };
    const logistics: Logistics = {
      pax: trip.pax,
      nights: trip.nights,
      startDate: trip.startDate ?? undefined,
      endDate: trip.endDate ?? undefined,
      country: trip.originCountry,
      city: trip.originCity,
    };

    const totals = calculatePaymentTotals({
      addons: { selected: addonsRaw },
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd,
      filters,
      logistics,
    });

    const amountUsd = totals.totalTrip;

    if (!amountUsd || amountUsd <= 0) {
      return NextResponse.json(
        { error: "Could not compute payment amount" },
        { status: 422 },
      );
    }

    // Stripe expects amount in cents (integer)
    const amountCents = Math.round(amountUsd * 100);

    // Idempotency: return the existing PENDING intent if present — but only
    // when its amount still matches the trip's current computed total. A
    // mismatch means the trip's configuration changed since this intent was
    // created; cancel it so the user cannot complete checkout at the stale
    // price, then fall through to create a fresh intent at the new amount.
    if (
      trip.payment?.status === "PENDING" &&
      trip.payment.stripePaymentIntentId
    ) {
      const existing = await stripe.paymentIntents.retrieve(
        trip.payment.stripePaymentIntentId,
      );
      if (
        existing.status === "requires_payment_method" ||
        existing.status === "requires_confirmation" ||
        existing.status === "requires_action"
      ) {
        if (existing.amount === amountCents) {
          if (existing.client_secret) {
            return NextResponse.json({
              clientSecret: existing.client_secret,
              paymentIntentId: existing.id,
            });
          }
          // Secret unavailable — fall through to create a fresh intent.
        } else {
          try {
            await stripe.paymentIntents.cancel(existing.id);
          } catch (cancelError) {
            // The intent moved on between retrieve and cancel — most likely
            // it just succeeded. Do NOT swallow-and-recreate, that is the
            // double-charge path. The webhook will have flipped the trip to
            // CONFIRMED by the next retry.
            console.error(
              "Stale PaymentIntent cancel failed:",
              cancelError,
            );
            return NextResponse.json(
              { error: "Payment already in progress, please retry" },
              { status: 409 },
            );
          }
        }
      }
    }

    // Create Stripe PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        tripId,
        userId: session.user.id,
      },
    });

    if (!intent.client_secret) {
      return NextResponse.json(
        { error: "Failed to obtain payment client secret" },
        { status: 500 },
      );
    }

    // Upsert Payment row — if this fails, cancel the Stripe intent to avoid orphaned intents
    try {
      await upsertPaymentForTripCheckout({
        userId: session.user.id,
        tripRequestId: tripId,
        provider: "stripe",
        amount: amountUsd,
        currency: "USD",
        stripePaymentIntentId: intent.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    } catch (dbError) {
      console.error(
        "DB upsert failed after Stripe intent creation, cancelling intent:",
        dbError,
      );
      await stripe.paymentIntents.cancel(intent.id).catch(() => {});
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (error) {
    console.error("payment-intent unhandled error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
