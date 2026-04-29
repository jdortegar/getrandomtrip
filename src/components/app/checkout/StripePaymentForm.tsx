"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { hasLocale } from "@/lib/i18n/config";

interface StripePaymentFormCopy {
  paymentBack: string;
  paymentSubmit: string;
  paymentProcessing: string;
}

interface StripePaymentFormProps {
  billingCity: string;
  billingCountry: string;
  billingEmail: string;
  billingLine1: string;
  billingName: string;
  billingPhone: string;
  billingPostalCode: string;
  billingState: string;
  copy: StripePaymentFormCopy;
  /** Validates contact form and saves user data before payment. Return false to abort. */
  onBeforeConfirm: () => Promise<boolean>;
  /** Called when user clicks Back. */
  onCancel: () => void;
}

export function StripePaymentForm({
  billingCity,
  billingCountry,
  billingEmail,
  billingLine1,
  billingName,
  billingPhone,
  billingPostalCode,
  billingState,
  copy,
  onBeforeConfirm,
  onCancel,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const params = useParams();
  const locale = hasLocale(params?.locale as string)
    ? (params?.locale as string)
    : "es";

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const ok = await onBeforeConfirm();
    if (!ok) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success`,
        payment_method_data: {
          billing_details: {
            email: billingEmail.trim() || undefined,
            name: billingName.trim() || undefined,
            phone: billingPhone.trim() || undefined,
            address: {
              line1: billingLine1.trim() || undefined,
              city: billingCity.trim() || undefined,
              state: billingState.trim() || undefined,
              postal_code: billingPostalCode.trim() || undefined,
              country: billingCountry.trim().toUpperCase() || undefined,
            },
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    window.location.href = `/${locale}/checkout/success`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "never",
              address: "never",
            },
          },
        }}
      />
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
          size="lg"
        >
          {copy.paymentBack}
        </Button>
        <Button
          className="flex-1"
          disabled={!stripe || isProcessing}
          type="submit"
          size="lg"
        >
          {isProcessing ? copy.paymentProcessing : copy.paymentSubmit}
        </Button>
      </div>
    </form>
  );
}
