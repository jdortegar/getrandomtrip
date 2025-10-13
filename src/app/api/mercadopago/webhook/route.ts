import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log('MercadoPago webhook received:', { type, data });

    // Handle different payment events
    switch (type) {
      case 'payment':
        if (data?.id) {
          // Payment was created/updated
          console.log('Payment event received:', data.id);
          // Here you can update your database with payment status
          // await updateTripPaymentStatus(data.id, 'pending');
        }
        break;

      case 'merchant_order':
        if (data?.id) {
          // Order was created/updated
          console.log('Merchant order event received:', data.id);
        }
        break;

      default:
        console.log('Unknown webhook type:', type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
