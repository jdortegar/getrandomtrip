import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findPaymentByStripeIntentId } from "@/lib/db/payment";
import { getStripe } from "@/lib/stripe";

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
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trip = payment.tripRequest;

  let receiptUrl: string | null = null;
  if (payment.stripePaymentIntentId) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(
        payment.stripePaymentIntentId,
        { expand: ["latest_charge"] },
      );
      const charge = pi.latest_charge;
      if (charge && typeof charge === "object" && "receipt_url" in charge) {
        receiptUrl = (charge as { receipt_url: string | null }).receipt_url;
      }
    } catch {
      // non-fatal — button will be hidden
    }
  }

  return NextResponse.json({
    payment: {
      amount: payment.amount,
      currency: payment.currency,
      receiptUrl,
    },
    trip: {
      id: trip.id,
      endDate: trip.endDate?.toISOString() ?? null,
      level: trip.level,
      nights: trip.nights,
      originCity: trip.originCity,
      originCountry: trip.originCountry,
      pax: trip.pax,
      startDate: trip.startDate?.toISOString() ?? null,
      type: trip.type,
    },
  });
}
