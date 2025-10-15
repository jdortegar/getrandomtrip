import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/db/payment';
import { prisma } from '@/lib/prisma';

// Use production or test credentials based on NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';
const accessToken = isProduction
  ? process.env.MERCADOPAGO_LIVE_ACCESS_TOKEN!
  : process.env.MERCADOPAGO_TEST_ACCESS_TOKEN!;

const client = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 5000,
  },
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const { total, tripId, userEmail, userName, userId } = await request.json();

    console.log('MercadoPago preference request:', {
      total,
      tripId,
      userEmail,
      userName,
      userId,
    });

    if (!total || total <= 0) {
      console.error('Invalid total amount:', total);
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 },
      );
    }

    if (!tripId) {
      console.error('Trip ID is required');
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 },
      );
    }

    if (!userId) {
      console.error('User ID is required');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    if (!accessToken) {
      console.error('MercadoPago access token not configured');
      return NextResponse.json(
        { error: 'Payment configuration missing' },
        { status: 500 },
      );
    }

    // Split user name into first and last name
    const nameParts = (userName || 'Cliente').split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'GetRandomTrip';

    const baseUrl = 'https://getrandomtrip.vercel.app'; //process.env.NEXTAUTH_URL || 'http://localhost:3010';

    const preferenceData = {
      items: [
        {
          id: tripId || `trip-${Date.now()}`,
          title: 'Viaje Sorpresa - GetRandomTrip',
          description: 'Tu aventura sorpresa personalizada',
          category_id: 'travel',
          quantity: 1,
          unit_price: Number(total),
          currency_id: 'USD',
        },
      ],
      payer: {
        name: firstName,
        surname: lastName,
        email: userEmail || 'cliente@example.com',
      },
      back_urls: {
        success: `${baseUrl}/journey/confirmation`,
        failure: `${baseUrl}/journey/checkout`,
        pending: `${baseUrl}/journey/checkout`,
      },
      auto_return: 'approved' as const,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      external_reference: tripId || `trip-${Date.now()}`,
      statement_descriptor: 'GETRANDOMTRIP',
      metadata: {
        trip_id: tripId,
        source: 'getrandomtrip',
      },
    };

    const requestOptions = {
      idempotencyKey: `${tripId}-${Date.now()}`,
    };

    const response = await preference.create({
      body: preferenceData,
      requestOptions,
    });

    // Create payment record in database
    if (userId && tripId) {
      try {
        // Verify user exists before creating payment
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!userExists) {
          console.error('User not found in database:', userId);
          return NextResponse.json(
            { error: 'User not found. Please logout and login again.' },
            { status: 400 },
          );
        }

        await createPayment({
          userId,
          tripId,
          provider: 'mercadopago',
          providerPreferenceId: response.id,
          amount: total,
          currency: 'ARS',
          mpExternalReference: tripId,
          mpDescription: preferenceData.items[0].description,
          mpStatementDescriptor: 'GETRANDOMTRIP',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
      } catch (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue with preference even if payment record fails
        // The webhook will handle payment tracking
      }
    }

    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id,
    });
  } catch (error) {
    console.error('MercadoPago error:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? (error as any).message || JSON.stringify(error)
          : String(error);

    return NextResponse.json(
      {
        error: 'Failed to create payment preference',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
