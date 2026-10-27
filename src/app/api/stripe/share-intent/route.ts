import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number, errorCode?: string) =>
  NextResponse.json({ error, ...(errorCode ? { errorCode } : {}) }, { status });

/**
 * POST /api/stripe/share-intent { travelerId }
 *
 * Returns a PaymentIntent for the signed-in companion's own share of an
 * INDIVIDUAL trip that is still collecting payments. A USD 0 share (a promo
 * that zeroes the trip) is settled here without Stripe.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Unauthorized", 401);
    let body: { travelerId?: unknown };
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request body", 400);
    }
    if (typeof body.travelerId !== "string" || !body.travelerId) {
      return fail("travelerId is required", 400);
    }

    const traveler = await prisma.tripTraveler.findUnique({
      where: { id: body.travelerId },
      include: { tripRequest: true, paymentShares: { where: { kind: "SHARE" } } },
    });
    // Another user's traveler row is indistinguishable from a missing one.
    if (!traveler || traveler.userId !== session.user.id) {
      return fail("Share not found", 404);
    }
    const trip = traveler.tripRequest;
    if (trip.paymentMode !== "INDIVIDUAL" || trip.status !== "COLLECTING") {
      return fail("Trip is not collecting payments", 409, "NOT_COLLECTING");
    }
    if (!trip.paymentDeadline || trip.paymentDeadline.getTime() <= Date.now()) {
      return fail("The payment deadline has passed", 409, "DEADLINE_PASSED");
    }
    const share = traveler.paymentShares[0];
    if (!share) return fail("Share not found", 404);
    if (share.status === "APPROVED") {
      return NextResponse.json({ paid: true, amount: share.amount, currency: share.currency });
    }
    if (!(RETRYABLE_PAYMENT_STATUSES as readonly string[]).includes(share.status)) {
      return fail("Payment already in progress, please retry", 409);
    }

    const amountCents = Math.round(share.amount * 100);
    if (amountCents === 0) {
      await prisma.paymentShare.updateMany({
        where: { id: share.id, status: share.status },
        data: { status: "APPROVED", paidAt: new Date(), userId: session.user.id },
      });
      return NextResponse.json({ paid: true, amount: 0, currency: share.currency });
    }

    const stripe = getStripe();
    let existing: Stripe.PaymentIntent | null = null;
    if (share.stripePaymentIntentId) {
      try {
        existing = await stripe.paymentIntents.retrieve(share.stripePaymentIntentId);
      } catch (error) {
        // An ambiguous failure must never result in a second live intent.
        if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) {
          return fail("Failed to verify existing payment intent", 502);
        }
      }
    }
    if (existing && ["processing", "succeeded", "requires_capture"].includes(existing.status)) {
      return fail("Payment already in progress, please retry", 409);
    }
    const canReuse =
      existing &&
      existing.status !== "canceled" &&
      existing.amount === amountCents &&
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
        currency: share.currency.toLowerCase(),
        metadata: {
          kind: "SHARE",
          shareId: share.id,
          travelerId: traveler.id,
          tripId: trip.id,
          userId: session.user.id,
        },
      });
      const claimed = await prisma.paymentShare.updateMany({
        where: {
          id: share.id,
          stripePaymentIntentId: share.stripePaymentIntentId,
          status: { in: [...RETRYABLE_PAYMENT_STATUSES] },
        },
        data: { stripePaymentIntentId: intent.id, status: "PENDING", userId: session.user.id },
      });
      if (claimed.count !== 1) {
        await stripe.paymentIntents.cancel(intent.id).catch(() => {});
        return fail("Payment already in progress, please retry", 409);
      }
    }
    if (!intent?.client_secret) return fail("Failed to obtain payment client secret", 500);

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: share.amount,
      currency: share.currency,
      paymentDeadline: trip.paymentDeadline.toISOString(),
    });
  } catch (error) {
    console.error("Share intent failed:", error);
    return fail("Internal server error", 500);
  }
}
