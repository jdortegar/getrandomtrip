export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updatePaymentFromStripeWebhook } from '@/lib/db/payment';
import type { UpdatePaymentData } from '@/lib/db/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

// Only maps statuses produced by the three events we handle.
// payment_intent.processing is intentionally omitted — we don't subscribe to that event.
const STRIPE_STATUS_MAP: Record<string, UpdatePaymentData['status']> = {
  succeeded: 'APPROVED',
  canceled: 'CANCELLED',
  requires_payment_method: 'FAILED',
  requires_action: 'PENDING',
  requires_confirmation: 'PENDING',
};

export async function POST(request: NextRequest) {
  // Must read raw text — request.json() corrupts the body and breaks signature verification
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const newStatus = STRIPE_STATUS_MAP[intent.status] ?? 'PENDING';
        const updateData: UpdatePaymentData = {
          status: newStatus,
          providerPaymentId: intent.id,
          stripePaymentIntentId: intent.id,
          // Use Stripe's settlement timestamp, not server clock
          paidAt: intent.status === 'succeeded' ? new Date(intent.created * 1000) : undefined,
        };
        await updatePaymentFromStripeWebhook(intent.id, updateData, event);
        break;
      }
      default:
        // Not an event we act on — still return 200 so Stripe doesn't retry
        break;
    }
  } catch (error) {
    const isNotFound =
      error instanceof Error && error.message.includes('Payment not found');

    if (isNotFound) {
      // Permanent mismatch — retrying won't help (payment was never created on our side)
      console.error('Stripe webhook: no matching payment row', { eventType: event.type, error });
      return NextResponse.json({ received: true });
    }

    // Transient error (DB timeout, etc.) — return 500 so Stripe retries
    console.error('Stripe webhook processing error:', { eventType: event.type, error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
