"use client";

import Link from "next/link";
import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementLocale } from "@stripe/stripe-js";
import { Sparkle } from "lucide-react";
import { useParams } from "next/navigation";

import { FormField, FormSelectField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { AMERICAN_COUNTRIES } from "@/lib/data/shared/countries";
import type { CheckoutFormFields } from "@/types/Checkout";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CurrencyDict } from "@/lib/types/dictionary";
import { hasLocale } from "@/lib/i18n/config";
import { getStripePromise } from "@/lib/stripe-client";
import { stripeAppearance } from "@/lib/stripe-appearance";
import { cn } from "@/lib/utils";
import { CheckoutCurrencyNote } from "./CheckoutCurrencyNote";
import { StripePaymentForm } from "./StripePaymentForm";


interface CheckoutContactCardProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  clientSecret: string | null;
  /** Shows the permanent "charged in USD" note above the payment form. */
  currencyCopy?: CurrencyDict;
  formData: CheckoutFormFields;
  formRef: React.RefObject<HTMLFormElement | null>;
  isXsed?: boolean;
  onBack: () => void;
  onBeforeConfirm: () => Promise<boolean>;
  onFieldChange: (field: keyof CheckoutFormFields, value: string) => void;
  onPaymentInfoSubmitted?: () => void;
  onPaymentProcessingChange: (processing: boolean) => void;
  onRetryPayment: () => void;
  paymentError: string | null;
  /** Neutral reason the payment form is held back (no retry action). */
  paymentNotice?: string | null;
  paymentRecoveryHref?: string;
  retryLabel: string;
  sessionEmail: string;
  summary: Dictionary["journey"]["summary"];
}

export function CheckoutContactCard({
  checkoutCopy,
  clientSecret,
  currencyCopy,
  paymentNotice = null,
  formData,
  formRef,
  isXsed = false,
  onBack,
  onBeforeConfirm,
  onFieldChange,
  onPaymentInfoSubmitted,
  onPaymentProcessingChange,
  onRetryPayment,
  paymentError,
  paymentRecoveryHref,
  retryLabel,
  sessionEmail,
  summary,
}: CheckoutContactCardProps) {
  const params = useParams();
  const [paymentElement, setPaymentElement] = useState(() => ({
    attempt: 0,
    stripe: getStripePromise(),
  }));
  const rawLocale = params?.locale as string | undefined;
  const stripeLocale: StripeElementLocale = hasLocale(rawLocale)
    ? (rawLocale as StripeElementLocale)
    : "es";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-md",
        "ring-1 ring-gray-100",
      )} data-component="CheckoutContactCard"
    >
      <h2 className="font-barlow-condensed text-4xl font-bold uppercase">
        {checkoutCopy.contactTitle}
      </h2>

      <form
        className="space-y-6"
        onSubmit={(e) => e.preventDefault()}
        ref={formRef}
      >
        {/* Email — read-only from session */}
        <div className="flex flex-col gap-1">
          <FormField
            className="disabled:cursor-not-allowed disabled:opacity-80"
            disabled
            id="email"
            label={checkoutCopy.contactEmailLabel}
            readOnly
            type="email"
            value={sessionEmail}
          />
          <p className="text-sm text-gray-500">
            {checkoutCopy.contactEmailHelper}
          </p>
        </div>

        {/* Name + Phone */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            id="name"
            label={checkoutCopy.contactNameLabel}
            onChange={(e) => onFieldChange("name", e.target.value)}
            required
            type="text"
            value={formData.name}
          />
          <FormField
            id="phone"
            label={checkoutCopy.contactPhoneLabel}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            required
            type="tel"
            value={formData.phone}
          />
        </div>

        {/* Street */}
        <FormField
          id="street"
          label={checkoutCopy.contactStreetLabel}
          onChange={(e) => onFieldChange("street", e.target.value)}
          required
          type="text"
          value={formData.street}
        />

        {/* City + State */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            id="city"
            label={checkoutCopy.contactCityLabel}
            onChange={(e) => onFieldChange("city", e.target.value)}
            required
            type="text"
            value={formData.city}
          />
          <FormField
            id="state"
            label={checkoutCopy.contactStateLabel}
            onChange={(e) => onFieldChange("state", e.target.value)}
            type="text"
            value={formData.state}
          />
        </div>

        {/* ZIP + Country */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            id="zip-code"
            label={checkoutCopy.contactZipCodeLabel}
            onChange={(e) => onFieldChange("zipCode", e.target.value)}
            type="text"
            value={formData.zipCode}
          />
          <FormSelectField
            id="country"
            label={checkoutCopy.contactCountryLabel}
            onChange={(e) => onFieldChange("country", e.target.value)}
            required
            value={formData.country}
          >
            <option value="">{checkoutCopy.contactCountryPlaceholder}</option>
            {AMERICAN_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </FormSelectField>
        </div>

        {/* ID Document */}
        <FormField
          id="id-document"
          label={checkoutCopy.contactIdDocumentLabel}
          onChange={(e) => onFieldChange("idDocument", e.target.value)}
          required
          type="text"
          value={formData.idDocument}
        />
      </form>

      {/* Payment section */}
      <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
        <h3 className="text-xl font-semibold text-ink">
          {checkoutCopy.paymentTitle}
        </h3>

        {paymentError ? (
          <div role="alert">
            <p className="text-red-700 text-sm">{paymentError}</p>
            {paymentRecoveryHref ? (
              <Button asChild variant="secondary">
                <Link href={paymentRecoveryHref}>{checkoutCopy.reviewTripDates}</Link>
              </Button>
            ) : (
              <Button onClick={onRetryPayment} type="button" variant="secondary">{retryLabel}</Button>
            )}
          </div>
        ) : paymentNotice ? (
          <p className="text-sm text-neutral-600" role="status">
            {paymentNotice}
          </p>
        ) : clientSecret ? (
          <>
            {currencyCopy ? <CheckoutCurrencyNote copy={currencyCopy} /> : null}
            <Elements
              key={`${clientSecret}:${paymentElement.attempt}`}
              options={{
                appearance: stripeAppearance,
                clientSecret,
                locale: stripeLocale,
                fonts: [
                  {
                    cssSrc:
                      "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap",
                  },
                ],
              }}
              stripe={paymentElement.stripe}
            >
              <StripePaymentForm
                billingCity={formData.city}
                billingCountry={formData.country}
                billingEmail={sessionEmail}
                billingLine1={formData.street}
                billingName={formData.name}
                billingPhone={formData.phone}
                billingPostalCode={formData.zipCode}
                billingState={formData.state}
                copy={{
                  paymentBack: checkoutCopy.paymentBack,
                  paymentProcessing: checkoutCopy.paymentProcessing,
                  paymentLoading: checkoutCopy.paymentLoading,
                  paymentLoadError: checkoutCopy.paymentLoadError,
                  paymentRetry: checkoutCopy.paymentRetry,
                  paymentFailed: checkoutCopy.paymentFailed,
                  paymentSubmit: checkoutCopy.paymentSubmit,
                }}
                onBeforeConfirm={onBeforeConfirm}
                onCancel={onBack}
                onPaymentInfoSubmitted={onPaymentInfoSubmitted}
                onProcessingChange={onPaymentProcessingChange}
                onRetry={() => {
                  const stripe = getStripePromise();
                  setPaymentElement((previous) => ({ attempt: previous.attempt + 1, stripe }));
                }}
              />
            </Elements>
          </>
        ) : (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-gray-100" />
            <div className="h-10 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        )}
      </div>

      <div className="rounded-xl bg-neutral-100 p-4 text-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkle aria-hidden className="h-4 w-4 shrink-0 text-ink" />
          <span className="text-base font-bold text-ink">
            {isXsed ? summary?.xsedImportantTitle : summary?.importantTitle}
          </span>
        </div>
        <ul className="list-outside list-disc space-y-1 pl-4 text-sm font-normal text-ink">
          {isXsed ? (
            <>
              <li>{summary?.xsedImportantNote1}</li>
              <li>{summary?.xsedImportantNote2}</li>
              <li>{summary?.xsedImportantNote3}</li>
              <li>{summary?.xsedImportantNote4}</li>
            </>
          ) : (
            <>
              <li>{summary?.importantNote1}</li>
              <li>{summary?.importantNote2}</li>
              <li>{summary?.importantNote3}</li>
              <li>{summary?.importantNote4}</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
