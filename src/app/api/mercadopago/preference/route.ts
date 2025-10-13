import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

// Use production or test credentials based on NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';
const accessToken = isProduction
  ? process.env.MERCADOPAGO_LIVE_ACCESS_TOKEN!
  : process.env.MERCADOPAGO_TEST_ACCESS_TOKEN!;

const client = new MercadoPagoConfig({
  accessToken,
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const { total, tripId, userEmail, userName } = await request.json();

    console.log('Creating MercadoPago preference with:', {
      total,
      tripId,
      userEmail,
      userName,
    });

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 },
      );
    }

    // Check if access token is available
    if (!accessToken) {
      console.error(
        `${isProduction ? 'MERCADOPAGO_LIVE_ACCESS_TOKEN' : 'MERCADOPAGO_TEST_ACCESS_TOKEN'} is not set`,
      );
      return NextResponse.json(
        { error: 'MercadoPago configuration missing' },
        { status: 500 },
      );
    }

    console.log('Environment:', isProduction ? 'PRODUCTION' : 'TEST');

    // Split user name into first and last name
    const nameParts = (userName || 'Cliente').split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'GetRandomTrip';

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';

    const preferenceData = {
      items: [
        {
          id: tripId || 'trip-001',
          title: 'Viaje Sorpresa - GetRandomTrip',
          description: 'Tu aventura sorpresa personalizada',
          category_id: 'travel', // Category for fraud prevention
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
      // auto_return: 'approved' as const, // Removed - conflicts with binary_mode
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      external_reference: tripId || `trip-${Date.now()}`,
      statement_descriptor: 'GETRANDOMTRIP', // Shows on credit card statement
      binary_mode: true, // Instant approval/rejection (no pending)
      metadata: {
        trip_id: tripId,
        source: 'getrandomtrip',
      },
    };

    console.log('Preference data:', JSON.stringify(preferenceData, null, 2));

    const response = await preference.create({ body: preferenceData });

    console.log('MercadoPago preference created successfully:', response.id);

    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id,
    });
  } catch (error) {
    console.error('MercadoPago preference creation error:', error);
    console.error('Error type:', typeof error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Return more specific error information
    let errorMessage = 'Unknown error';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'object' && error !== null) {
      // MercadoPago SDK errors are often plain objects
      const errObj = error as any;
      errorMessage = errObj.message || errObj.error || JSON.stringify(error);
      errorDetails = JSON.stringify(error, null, 2);
    } else {
      errorMessage = String(error);
      errorDetails = String(error);
    }

    return NextResponse.json(
      {
        error: 'Failed to create payment preference',
        details: errorMessage,
        debug:
          process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 },
    );
  }
}
