'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { hasLocale } from '@/lib/i18n/config';

interface StripePaymentFormProps {
  /** Called when user clicks Back to return to the contact form step. */
  onCancel: () => void;
}

export function StripePaymentForm({ onCancel }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const params = useParams();
  const locale = hasLocale(params?.locale as string) ? (params?.locale as string) : 'es';

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success`,
      },
      // For non-3DS cards: resolves here without redirect.
      // For 3DS cards: redirects to return_url, which is /checkout/success.
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    // Non-3DS success — navigate to success page
    window.location.href = `/${locale}/checkout/success`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          disabled={isProcessing}
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={!stripe || isProcessing}
          type="submit"
        >
          {isProcessing ? 'Processing...' : 'Pay now'}
        </Button>
      </div>
    </form>
  );
}
