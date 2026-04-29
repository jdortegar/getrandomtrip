import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePaymentTotals } from '@/lib/helpers/payment-totals';
import { getPricePerPerson } from '@/lib/data/traveler-types';
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

    const { tripId, promoCode } = (await request.json()) as {
      tripId?: string;
      promoCode?: string;
    };

    if (!tripId || !promoCode?.trim()) {
      return NextResponse.json(
        { error: 'tripId and promoCode are required' },
        { status: 400 },
      );
    }

    // Fetch trip + payment
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

    // Look up promotion code in Stripe
    const promoCodes = await stripe.promotionCodes.list({
      code: promoCode.trim().toUpperCase(),
      active: true,
      limit: 1,
    });

    if (promoCodes.data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired promo code' },
        { status: 404 },
      );
    }

    const promoCodeObj = promoCodes.data[0];
    const couponRef = promoCodeObj.promotion.coupon;
    const coupon =
      typeof couponRef === 'string'
        ? await stripe.coupons.retrieve(couponRef)
        : (couponRef as Stripe.Coupon);

    if (!coupon.valid) {
      return NextResponse.json(
        { error: 'This promo code is no longer valid' },
        { status: 409 },
      );
    }

    // Recalculate original amount server-side
    const basePriceUsd = getPricePerPerson(trip.type, trip.level, trip.pax);
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
      pax: trip.pax,
      startDate: trip.startDate ?? undefined,
    };
    const { totalTrip: originalAmountUsd } = calculatePaymentTotals({
      addons: { selected: addonsRaw },
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd,
      filters,
      logistics,
    });

    // Calculate discount
    let discountAmountUsd = 0;
    if (coupon.percent_off) {
      discountAmountUsd = (originalAmountUsd * coupon.percent_off) / 100;
    } else if (coupon.amount_off) {
      // amount_off is in the coupon's currency (cents)
      discountAmountUsd = coupon.amount_off / 100;
    }
    discountAmountUsd = Math.min(
      Math.round(discountAmountUsd * 100) / 100,
      originalAmountUsd,
    );

    const newAmountUsd = originalAmountUsd - discountAmountUsd;
    const newAmountCents = Math.max(50, Math.round(newAmountUsd * 100)); // Stripe minimum $0.50

    // Update PaymentIntent with discounted amount
    await stripe.paymentIntents.update(trip.payment.stripePaymentIntentId, {
      amount: newAmountCents,
      metadata: {
        promoCode: promoCode.trim().toUpperCase(),
        promoCodeId: promoCodeObj.id,
        discountAmountUsd: String(discountAmountUsd),
      },
    });

    return NextResponse.json({
      code: promoCode.trim().toUpperCase(),
      discountAmount: discountAmountUsd,
      discountLabel: coupon.name ?? promoCode.trim().toUpperCase(),
      discountPercent: coupon.percent_off ?? null,
      newTotal: newAmountUsd,
    });
  } catch (error) {
    console.error('apply-promo error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
