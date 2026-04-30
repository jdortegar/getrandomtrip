import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { updatePaymentFromStripeWebhook } from '@/lib/db/payment';
import type { UpdatePaymentData } from '@/lib/db/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

/**
 * POST /api/stripe/confirm-payment
 *
 * Client-side fallback for when the Stripe webhook doesn't arrive in time.
 * Retrieves the PaymentIntent directly from Stripe and, if succeeded, applies
 * the same DB update the webhook would have applied (idempotent).
 *
 * Body: { paymentIntentId: string }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let paymentIntentId: string;
  try {
    ({ paymentIntentId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 });
  }

  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error('confirm-payment: failed to retrieve intent', err);
    return NextResponse.json({ error: 'PaymentIntent not found' }, { status: 404 });
  }

  // Only act on succeeded intents
  if (intent.status !== 'succeeded') {
    return NextResponse.json({ status: intent.status });
  }

  const updateData: UpdatePaymentData = {
    status: 'APPROVED',
    providerPaymentId: intent.id,
    stripePaymentIntentId: intent.id,
    paidAt: new Date(intent.created * 1000),
  };

  try {
    await updatePaymentFromStripeWebhook(intent.id, updateData);
  } catch (err) {
    const isNotFound = err instanceof Error && err.message.includes('Payment not found');
    if (isNotFound) {
      // No matching payment row — nothing we can do client-side
      console.error('confirm-payment: no matching payment row for intent', paymentIntentId);
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }
    console.error('confirm-payment: DB update failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ status: 'succeeded' });
}
