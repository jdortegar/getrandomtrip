import { useState } from 'react';
import {
  calculatePaymentTotals,
  type PaymentTotalsInput,
  type PaymentTotalsResult,
} from '@/lib/helpers/payment-totals';

/**
 * Hook for payment calculations and Stripe PaymentIntent creation.
 * Amount is computed server-side; this hook only triggers the intent creation.
 */
export function usePayment(paymentData: PaymentTotalsInput) {
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateTotals = (): PaymentTotalsResult =>
    calculatePaymentTotals(paymentData);

  /**
   * Creates a Stripe PaymentIntent for the given trip.
   * Returns the client secret needed to mount <PaymentElement>.
   */
  const createPaymentIntent = async (
    tripId: string,
  ): Promise<{ clientSecret: string }> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to create payment intent');
      }

      const { clientSecret } = (await response.json()) as { clientSecret: string };
      return { clientSecret };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    calculateTotals,
    createPaymentIntent,
  };
}
