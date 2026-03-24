import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updatePaymentFromWebhook } from '@/lib/db/payment';

function getMercadoPagoAccessToken(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction
    ? process.env.MERCADOPAGO_LIVE_ACCESS_TOKEN!
    : process.env.MERCADOPAGO_TEST_ACCESS_TOKEN!;
}

function normalizeNotificationPaymentId(
  raw: string | number | undefined | null,
): string | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  return s.length > 0 ? s : null;
}

/**
 * Mercado Pago webhooks: `type` + `data.id` (see MP notifications docs).
 * We fetch the full payment resource and reconcile DB (incl. `mpCheckoutReturn` merge).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: string;
      data?: { id?: string | number };
      type?: string;
    };

    const { action, data, type } = body;

    console.log('MercadoPago webhook received:', { action, data, type });

    if (type === 'payment') {
      const paymentId = normalizeNotificationPaymentId(data?.id);
      if (!paymentId) {
        console.warn('MercadoPago webhook: payment notification without data.id');
        return NextResponse.json({ received: true });
      }

      const accessToken = getMercadoPagoAccessToken();
      if (!accessToken) {
        console.error('MercadoPago webhook: access token not configured');
        return NextResponse.json(
          { error: 'Payment configuration missing' },
          { status: 500 },
        );
      }

      const client = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 },
      });
      const paymentApi = new Payment(client);

      try {
        const paymentDetails = await paymentApi.get({ id: paymentId });
        await updatePaymentFromWebhook(paymentDetails, body);
        console.log('MercadoPago webhook: payment updated', { id: paymentId });
      } catch (error) {
        console.error('MercadoPago webhook: payment update failed', {
          error,
          paymentId,
        });
        // Still 200 so MP does not retry indefinitely; monitor logs / alerts.
      }

      return NextResponse.json({ received: true });
    }

    if (type === 'merchant_order') {
      const orderId = normalizeNotificationPaymentId(data?.id);
      console.log('MercadoPago webhook: merchant_order (not persisted yet)', {
        orderId,
      });
      return NextResponse.json({ received: true });
    }

    console.log('MercadoPago webhook: unhandled type', type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('MercadoPago webhook: processing error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
