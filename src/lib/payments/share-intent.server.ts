import type { PaymentShare } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const fail = (error: string, status: number, errorCode?: string) =>
  NextResponse.json({ error, ...(errorCode ? { errorCode } : {}) }, { status });

/**
 * Returns a payable intent for one share the caller already proved is theirs
 * and still open: reports paid shares, settles USD 0 without Stripe, reuses an
 * unpaid intent of the same amount, and never leaves two live intents. Intent
 * metadata carries the share kind so the webhook settles the share itself.
 */
export async function respondWithShareIntent(
  share: Pick<PaymentShare, "id" | "kind" | "amount" | "currency" | "status" | "stripePaymentIntentId">,
  context: { tripId: string; travelerId: string | null; userId: string; extra?: Record<string, string> },
) {
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
      data: { status: "APPROVED", paidAt: new Date(), userId: context.userId },
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
        kind: share.kind,
        shareId: share.id,
        ...(context.travelerId ? { travelerId: context.travelerId } : {}),
        tripId: context.tripId,
        userId: context.userId,
      },
    });
    const claimed = await prisma.paymentShare.updateMany({
      where: {
        id: share.id,
        stripePaymentIntentId: share.stripePaymentIntentId,
        status: { in: [...RETRYABLE_PAYMENT_STATUSES] },
      },
      data: { stripePaymentIntentId: intent.id, status: "PENDING", userId: context.userId },
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
    ...context.extra,
  });
}
