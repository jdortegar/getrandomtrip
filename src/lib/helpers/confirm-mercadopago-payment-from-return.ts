import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

/**
 * Temporary fallback when webhook is unavailable:
 * confirms payment using Mercado Pago return query params.
 */
export async function confirmMercadoPagoPaymentFromReturnParams(
  params: MercadoPagoCheckoutReturnParams,
): Promise<void> {
  const externalReference = params.externalReference?.trim();
  const paymentId = (params.paymentId ?? params.collectionId)?.trim();

  if (!externalReference || !paymentId) {
    return;
  }

  await fetch('/api/payments/confirm', {
    body: JSON.stringify({
      externalReference,
      merchantOrderId: params.merchantOrderId,
      paymentId,
      status: params.status ?? params.collectionStatus ?? 'pending',
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}
