import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePaymentTotals } from '@/lib/helpers/payment-totals';
import { getPricePerPerson } from '@/lib/data/traveler-types';
import { getFixedPaxDetailsForTravelType } from '@/lib/helpers/pax-details';
import type { AddonSelection, Filters, Logistics } from '@/store/slices/journeyStore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = (await request.json()) as { tripId?: string };

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

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
    if (!trip.payment?.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'No payment intent found for this trip' },
        { status: 409 },
      );
    }

    // Recalculate original (undiscounted) amount using effective pax for the travel type
    const fixedPax = getFixedPaxDetailsForTravelType(trip.type);
    const effectivePax = fixedPax ? fixedPax.adults + fixedPax.minors : trip.pax;
    const basePriceUsd = getPricePerPerson(trip.type, trip.level, effectivePax);
    const addonsRaw = Array.isArray(trip.addons)
      ? (trip.addons as unknown as AddonSelection[])
      : [];
    const filters: Filters = {
      accommodationType: trip.accommodationType as Filters['accommodationType'],
      arrivePref: trip.arrivePref as Filters['arrivePref'],
      avoidDestinations: trip.avoidDestinations,
      climate: trip.climate as Filters['climate'],
      departPref: trip.departPref as Filters['departPref'],
      maxTravelTime: trip.maxTravelTime as Filters['maxTravelTime'],
      transport: trip.transport as Filters['transport'],
    };
    const logistics: Logistics = {
      city: trip.originCity,
      country: trip.originCountry,
      endDate: trip.endDate ?? undefined,
      nights: trip.nights,
      pax: effectivePax,
      startDate: trip.startDate ?? undefined,
    };
    const { totalTrip: originalAmountUsd } = calculatePaymentTotals({
      addons: { selected: addonsRaw },
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd,
      filters,
      logistics,
    });

    const originalAmountCents = Math.round(originalAmountUsd * 100);

    // Reset PaymentIntent to original amount and clear promo metadata
    await stripe.paymentIntents.update(trip.payment.stripePaymentIntentId, {
      amount: originalAmountCents,
      metadata: {
        promoCode: '',
        promoCodeId: '',
        discountAmountUsd: '',
      },
    });

    return NextResponse.json({ originalTotal: originalAmountUsd });
  } catch (error) {
    console.error('remove-promo error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
