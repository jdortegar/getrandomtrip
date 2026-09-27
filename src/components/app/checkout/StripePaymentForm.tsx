"use client";

import { useEffect, useRef, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { hasLocale } from "@/lib/i18n/config";

interface StripePaymentFormCopy {
  paymentBack: string;
  paymentSubmit: string;
  paymentProcessing: string;
  paymentLoading: string;
  paymentLoadError: string;
  paymentRetry: string;
  paymentFailed: string;
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
  onProcessingChange: (processing: boolean) => void;
  onRetry: () => void;
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
  onProcessingChange,
  onRetry,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const params = useParams();
  const locale = hasLocale(params?.locale as string)
    ? (params?.locale as string)
    : "es";

  const [elementReady, setElementReady] = useState(false);
  const [elementLoadError, setElementLoadError] = useState(false);
  const ready = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const processingCallback = useRef(onProcessingChange);
  useEffect(() => { processingCallback.current = onProcessingChange; }, [onProcessingChange]);
  useEffect(() => {
    mounted.current = true;
    const loadingTimeout = window.setTimeout(() => {
      if (!ready.current) setElementLoadError(true);
    }, 20000);
    return () => {
      window.clearTimeout(loadingTimeout);
      mounted.current = false;
      inFlight.current = false;
      processingCallback.current(false);
    };
  }, []);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements || !ready.current || inFlight.current) return;
    inFlight.current = true;

    setIsProcessing(true);
    onProcessingChange(true);
    setErrorMessage(null);

    try {
      const ok = await onBeforeConfirm();
      if (!ok || !mounted.current) {
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
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

      if (!mounted.current) return;
      if (error) {
        setErrorMessage(error.message ?? copy.paymentFailed);
        setIsProcessing(false);
        onProcessingChange(false);
        return;
      }

      // Pass payment_intent to success page so it can confirm the trip
      // even if the Stripe webhook hasn't arrived yet.
      const successUrl = new URL(
        `/${locale}/checkout/success`,
        window.location.origin,
      );
      if (paymentIntent?.id) {
        successUrl.searchParams.set("payment_intent", paymentIntent.id);
        successUrl.searchParams.set("redirect_status", paymentIntent.status);
      }
      window.location.href = successUrl.toString();
    } catch (error) {
      if (mounted.current)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : copy.paymentFailed,
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setIsProcessing(false);
        processingCallback.current(false);
      }
    }
  }

  return (
    <form className="space-y-6" data-component="StripePaymentForm" onSubmit={handleSubmit}>
      {!elementReady && !elementLoadError && (
        <p aria-busy="true" className="flex items-center gap-2 text-sm" role="status">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          {copy.paymentLoading}
        </p>
      )}
      {elementLoadError && (
        <div role="alert">
          <p className="text-sm text-red-600">{copy.paymentLoadError}</p>
          <Button disabled={isProcessing} onClick={onRetry} type="button" variant="secondary">
            {copy.paymentRetry}
          </Button>
        </div>
      )}
      <PaymentElement
        onLoadError={() => {
          ready.current = false;
          setElementReady(false);
          setElementLoadError(true);
        }}
        onReady={() => {
          ready.current = true;
          setElementReady(true);
          setElementLoadError(false);
        }}
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
          aria-busy={isProcessing}
          className="flex-1"
          disabled={!stripe || !elements || !elementReady || isProcessing}
          type="submit"
          size="lg"
        >
          {isProcessing && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {isProcessing ? copy.paymentProcessing : copy.paymentSubmit}
        </Button>
      </div>
    </form>
  );
}
