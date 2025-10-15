import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updatePaymentFromWebhook } from '@/lib/db/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log('MercadoPago webhook received:', { type, data });

    // Handle different payment events
    switch (type) {
      case 'payment':
        if (data?.id) {
          console.log('Payment event received:', data.id);

          try {
            // Get payment details from MercadoPago
            const isProduction = process.env.NODE_ENV === 'production';
            const accessToken = isProduction
              ? process.env.MERCADOPAGO_LIVE_ACCESS_TOKEN!
              : process.env.MERCADOPAGO_TEST_ACCESS_TOKEN!;

            const client = new MercadoPagoConfig({ accessToken });
            const payment = new Payment(client);

            const paymentDetails = await payment.get({ id: data.id });

            // Update payment in database
            await updatePaymentFromWebhook(data.id, paymentDetails);

            console.log('Payment updated successfully:', data.id);
          } catch (error) {
            console.error('Error updating payment:', error);
          }
        }
        break;

      case 'merchant_order':
        if (data?.id) {
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
