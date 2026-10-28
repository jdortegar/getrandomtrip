import type { TripRequest } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findPaymentByStripeIntentId } from "@/lib/db/payment";
import { findShareByIntent } from "@/lib/db/paymentShare";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getRosterForTrip } from "@/lib/travelers/travelerRoster";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/trip-summary?paymentIntentId=pi_xxx
 *
 * Returns the trip + payment data associated with a Stripe PaymentIntent.
 * Used by the success page to render a trip summary card.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId");
  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "paymentIntentId is required" },
      { status: 400 },
    );
  }

  const payment = await findPaymentByStripeIntentId(paymentIntentId);
  if (!payment) {
    // A companion's share or top-up: their own amount and receipt, never the roster or the bill.
    const share = await findShareByIntent(paymentIntentId);
    if (!share) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (share.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({
      payment: {
        amount: share.amount,
        currency: share.currency,
        status: share.status,
        receiptUrl: await receiptUrlFor(share.stripePaymentIntentId),
      },
      trip: { ...tripSummary(share.payment.tripRequest), roster: null },
    });
  }

  if (payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trip = payment.tripRequest;

  const receiptUrl = await receiptUrlFor(payment.stripePaymentIntentId);

  const roster = await getRosterForTrip(trip.id, session.user.id);
  // INDIVIDUAL: `Payment.amount` is the trip bill; the organizer paid only their share.
  const organizerShare = trip.paymentMode === "INDIVIDUAL"
    ? await prisma.paymentShare.findFirst({
        // A dropped companion's share also loses its traveler; only the organizer's is theirs.
        where: { paymentId: payment.id, travelerId: null, userId: payment.userId, kind: "SHARE" },
        select: { amount: true },
      })
    : null;

  return NextResponse.json({
    payment: {
      amount: organizerShare?.amount ?? payment.amount,
      currency: payment.currency,
      status: payment.status,
      receiptUrl,
    },
    trip: { ...tripSummary(trip), roster },
  });
}

/** Stripe receipt link for an intent's latest charge; null when unavailable. */
async function receiptUrlFor(intentId: string | null): Promise<string | null> {
  if (!intentId) return null;
  try {
    const pi = await getStripe().paymentIntents.retrieve(intentId, { expand: ["latest_charge"] });
    const charge = pi.latest_charge;
    if (charge && typeof charge === "object" && "receipt_url" in charge) {
      return (charge as { receipt_url: string | null }).receipt_url;
    }
  } catch {
    // non-fatal — button will be hidden
  }
  return null;
}

/** Trip fields the success page shows (no prices). */
function tripSummary(trip: TripRequest) {
  return {
    id: trip.id,
    status: trip.status,
    endDate: trip.endDate?.toISOString() ?? null,
    level: trip.level,
    nights: trip.nights,
    originCity: trip.originCity,
    originCountry: trip.originCountry,
    pax: trip.pax,
    paxDetails: trip.paxDetails,
    startDate: trip.startDate?.toISOString() ?? null,
    departureTimeZone: trip.departureTimeZone,
    type: trip.type,
  };
}
