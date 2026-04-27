import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePaymentTotals } from '@/lib/helpers/payment-totals';
import { getPricePerPerson } from '@/lib/data/traveler-types';
import { upsertPaymentForTripCheckout } from '@/lib/db/payment';
import type { AddonSelection, Filters, Logistics } from '@/store/slices/journeyStore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let tripId: string;
  try {
    ({ tripId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  // Fetch trip and verify ownership
  const trip = await prisma.tripRequest.findUnique({
    where: { id: tripId },
    include: { payment: true },
  });

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (trip.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const PAYABLE_STATUSES = ['SAVED', 'PENDING_PAYMENT'] as const;
  if (!PAYABLE_STATUSES.includes(trip.status as 'SAVED' | 'PENDING_PAYMENT')) {
    return NextResponse.json({ error: 'Trip is not in a payable state' }, { status: 409 });
  }

  // Idempotency: return existing PENDING intent if present
  if (
    trip.payment?.status === 'PENDING' &&
    trip.payment.stripePaymentIntentId
  ) {
    const existing = await stripe.paymentIntents.retrieve(
      trip.payment.stripePaymentIntentId,
    );
    if (
      existing.status === 'requires_payment_method' ||
      existing.status === 'requires_confirmation' ||
      existing.status === 'requires_action'
    ) {
      if (!existing.client_secret) {
        // Intent exists but secret is unavailable — fall through to create a new one
      } else {
        return NextResponse.json({
          clientSecret: existing.client_secret,
          paymentIntentId: existing.id,
        });
      }
    }
  }

  // Compute amount server-side
  const basePriceUsd = getPricePerPerson(trip.type, trip.level, trip.pax);

  const addonsRaw = Array.isArray(trip.addons) ? (trip.addons as unknown as AddonSelection[]) : [];
  const filters: Filters = {
    accommodationType: trip.accommodationType as Filters['accommodationType'],
    transport: trip.transport as Filters['transport'],
    climate: trip.climate as Filters['climate'],
    maxTravelTime: trip.maxTravelTime as Filters['maxTravelTime'],
    departPref: trip.departPref as Filters['departPref'],
    arrivePref: trip.arrivePref as Filters['arrivePref'],
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
    return NextResponse.json({ error: 'Could not compute payment amount' }, { status: 422 });
  }

  // Stripe expects amount in cents (integer)
  const amountCents = Math.round(amountUsd * 100);

  // Create Stripe PaymentIntent
  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata: {
      tripId,
      userId: session.user.id,
    },
  });

  if (!intent.client_secret) {
    return NextResponse.json({ error: 'Failed to obtain payment client secret' }, { status: 500 });
  }

  // Upsert Payment row — if this fails, cancel the Stripe intent to avoid orphaned intents
  try {
    await upsertPaymentForTripCheckout({
      userId: session.user.id,
      tripRequestId: tripId,
      provider: 'stripe',
      amount: amountUsd,
      currency: 'USD',
      stripePaymentIntentId: intent.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  } catch (dbError) {
    console.error('DB upsert failed after Stripe intent creation, cancelling intent:', dbError);
    await stripe.paymentIntents.cancel(intent.id).catch(() => {});
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  });
}
