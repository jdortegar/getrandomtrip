import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

/**
 * Persists redirect query params into `Payment.providerResponse.mpCheckoutReturn` (session required).
 */
export async function persistMercadoPagoCheckoutReturnParams(
  checkoutReturn: MercadoPagoCheckoutReturnParams,
): Promise<void> {
  if (!checkoutReturn.externalReference?.trim()) return;

  try {
    const response = await fetch('/api/payments/mercadopago/checkout-return', {
      body: JSON.stringify({ checkoutReturn }),
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      console.warn(
        'persistMercadoPagoCheckoutReturnParams:',
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.warn('persistMercadoPagoCheckoutReturnParams failed:', error);
  }
}
