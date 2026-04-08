import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  calculatePaymentTotals,
  type PaymentTotalsInput,
  type PaymentTotalsResult,
} from '@/lib/helpers/payment-totals';

interface UsePaymentOptions {
  locale?: string;
}

/**
 * Custom hook for payment calculations and MercadoPago integration
 * Follows Single Responsibility Principle - handles only payment logic
 */
export function usePayment(
  paymentData: PaymentTotalsInput,
  options?: UsePaymentOptions,
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session } = useSession();
  const locale = options?.locale ?? 'es';

  const calculateTotals = (): PaymentTotalsResult =>
    calculatePaymentTotals(paymentData);

  const initiatePayment = async (
    tripId?: string,
    payer?: { email?: string; name?: string },
  ): Promise<void> => {
    setIsProcessing(true);

    try {
      const totals = calculateTotals();

      const response = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale,
          total: totals.totalTrip,
          tripId: tripId || `trip-${Date.now()}`,
          userEmail:
            payer?.email ?? session?.user?.email ?? 'cliente@example.com',
          userName: payer?.name ?? session?.user?.name ?? 'Cliente',
          userId: session?.user?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment preference error:', errorData);
        throw new Error(
          errorData.error || 'Failed to create payment preference',
        );
      }

      const { init_point } = await response.json();
      window.location.href = init_point;
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al procesar el pago. Intenta nuevamente.';
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    calculateTotals,
    initiatePayment,
  };
}
