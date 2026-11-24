import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripeReceiptUrl } from "@/lib/payments/stripeReceiptUrl";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Only Stripe-hosted receipts are followed — never an arbitrary URL. */
const STRIPE_RECEIPT_HOST = "pay.stripe.com";

/**
 * GET /api/trips/[id]/receipt
 *
 * Redirects the trip's buyer to Stripe's hosted receipt for their payment
 * (the trip-details payment card links here). Buyer-only, like the payment
 * card itself: anyone else gets the same 404 as a trip without a receipt, so
 * the route never reveals whether a trip or payment exists.
 */
export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { tripRequestId: id },
    select: { userId: true, stripePaymentIntentId: true },
  });
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const receiptUrl = await getStripeReceiptUrl(payment.stripePaymentIntentId);
  if (!receiptUrl || new URL(receiptUrl).hostname !== STRIPE_RECEIPT_HOST) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.redirect(receiptUrl, 302);
}
