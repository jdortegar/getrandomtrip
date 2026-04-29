"use client";

import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, StripeElementLocale } from "@stripe/stripe-js";
import { Sparkle } from "lucide-react";
import { useParams } from "next/navigation";

import { FormField, FormSelectField } from "@/components/ui/FormField";
import { AMERICAN_COUNTRIES } from "@/lib/data/shared/countries";
import type { CheckoutFormFields } from "@/types/Checkout";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { stripePromise } from "@/lib/stripe-client";
import { cn } from "@/lib/utils";
import { StripePaymentForm } from "./StripePaymentForm";

// Mirrors FormField styles:
//   input  → bg-gray-100 (#f3f4f6), rounded-xl (12px), px-6 py-4, text-base, text-gray-900
//   label  → text-gray-600 (#4b5563), font-normal, text-base
//   focus  → outline-2 primary (#111827)
//   error  → text-red-600 (#dc2626)
//   tabs   → gray-100 unselected / gray-900 selected (matches primary Button)
const stripeAppearance: Appearance = {
  theme: "flat",
  variables: {
    // Colors
    colorPrimary: "#111827",
    colorBackground: "#f3f4f6",
    colorText: "#111827",
    colorTextSecondary: "#4b5563",
    colorTextPlaceholder: "#9ca3af",
    colorDanger: "#dc2626",
    colorSuccess: "#16a34a",
    // Icons
    iconColor: "#6b7280",
    iconHoverColor: "#111827",
    // Typography — Barlow loaded explicitly via Elements fonts prop
    fontFamily: "'Barlow', sans-serif",
    fontSizeBase: "16px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "700",
    fontLineHeight: "1.5",
    // Layout
    borderRadius: "12px",
    spacingUnit: "4px",
    gridRowSpacing: "24px",
    gridColumnSpacing: "24px",
    // Focus ring — matches app's focus-visible ring
    focusOutline: "2px solid #111827",
    focusBoxShadow: "none",
  },
  rules: {
    // ─── Inputs ────────────────────────────────────────────────────────────
    ".Input": {
      backgroundColor: "#f3f4f6",
      border: "none",
      boxShadow: "none",
      padding: "16px 24px",
      fontSize: "16px",
      color: "#111827",
      transition: "outline 0.1s ease",
    },
    ".Input::placeholder": {
      color: "#9ca3af",
    },
    ".Input:hover": {
      backgroundColor: "#f3f4f6",
    },
    ".Input:focus": {
      backgroundColor: "#f3f4f6",
      boxShadow: "none",
      outline: "2px solid #111827",
      outlineOffset: "-2px",
    },
    ".Input--invalid": {
      backgroundColor: "#f3f4f6",
      boxShadow: "none",
      outline: "2px solid #dc2626",
      outlineOffset: "-2px",
      color: "#111827",
    },
    ".Input:disabled": {
      opacity: "0.6",
      cursor: "not-allowed",
    },
    // ─── Labels ────────────────────────────────────────────────────────────
    ".Label": {
      color: "#4b5563",
      fontWeight: "400",
      fontSize: "16px",
      marginBottom: "8px",
    },
    ".Label--invalid": {
      color: "#dc2626",
    },
    // ─── Errors ────────────────────────────────────────────────────────────
    ".Error": {
      color: "#dc2626",
      fontSize: "14px",
      marginTop: "6px",
    },
    // ─── Payment method tabs ────────────────────────────────────────────────
    ".Tab": {
      // backgroundColor: "#f3f4f6",
      border: "none",
      boxShadow: "none",
      color: "#6b7280",
      fontWeight: "500",
      borderRadius: "12px",
      padding: "10px 16px",
      transition: "background-color 0.15s ease, color 0.15s ease",
    },
    ".Tab:hover": {
      backgroundColor: "#e5e7eb",
      color: "#111827",
    },
    ".Tab--selected": {
      backgroundColor: "#111827",
      color: "#ffffff",
      boxShadow: "none",
    },
    ".Tab:focus": {
      boxShadow: "none",
      outline: "2px solid #111827",
      outlineOffset: "2px",
    },
    ".TabLabel": {
      fontWeight: "500",
    },
    ".TabLabel--selected": {
      color: "#ffffff",
    },
    // ─── Accordion items (layout: "accordion") ─────────────────────────────
    ".AccordionItem": {
      backgroundColor: "#f3f4f6",
      borderRadius: "12px",
      border: "none",
      boxShadow: "none",
    },
    ".AccordionItem--selected": {
      backgroundColor: "#f3f4f6",
      boxShadow: "none",
    },
    // ─── Block dividers ────────────────────────────────────────────────────
    ".BlockDivider": {
      backgroundColor: "#e5e7eb",
    },
    // ─── Stripe internal buttons (Link "Use this card", etc.) ──────────────
    // Matches app primary Button: bg-primary, text-white, Barlow semibold uppercase
    ".Button": {
      backgroundColor: "#111827",
      color: "#ffffff",
      borderRadius: "3px",
      border: "2px solid #ffffff",
      fontFamily: "'Barlow', sans-serif",
      fontWeight: "600",
      fontSize: "16px",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      transition: "background-color 0.15s ease",
    },
    ".Button:hover": {
      backgroundColor: "#1f2937",
    },
    ".Button:focus": {
      boxShadow: "none",
      outline: "2px solid #111827",
      outlineOffset: "2px",
    },
    ".Button:disabled": {
      opacity: "0.5",
    },
  },
};

interface CheckoutContactCardProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  clientSecret: string | null;
  formData: CheckoutFormFields;
  formRef: React.RefObject<HTMLFormElement>;
  onBack: () => void;
  onBeforeConfirm: () => Promise<boolean>;
  onFieldChange: (field: keyof CheckoutFormFields, value: string) => void;
  sessionEmail: string;
  summary: Dictionary["journey"]["summary"];
}

export function CheckoutContactCard({
  checkoutCopy,
  clientSecret,
  formData,
  formRef,
  onBack,
  onBeforeConfirm,
  onFieldChange,
  sessionEmail,
  summary,
}: CheckoutContactCardProps) {
  const params = useParams();
  const rawLocale = params?.locale as string | undefined;
  const stripeLocale: StripeElementLocale = hasLocale(rawLocale)
    ? (rawLocale as StripeElementLocale)
    : "es";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-md",
        "ring-1 ring-gray-100",
      )}
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
        <h3 className="text-xl font-semibold text-neutral-900">
          {checkoutCopy.paymentTitle}
        </h3>

        {clientSecret ? (
          <Elements
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
            stripe={stripePromise}
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
                paymentSubmit: checkoutCopy.paymentSubmit,
              }}
              onBeforeConfirm={onBeforeConfirm}
              onCancel={onBack}
            />
          </Elements>
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
          <Sparkle aria-hidden className="h-4 w-4 shrink-0 text-neutral-500" />
          <span className="text-base font-bold text-gray-900">
            {summary?.importantTitle}
          </span>
        </div>
        <ul className="list-outside list-disc space-y-1 pl-4 text-sm font-normal text-gray-900">
          <li>{summary?.importantNote1}</li>
          <li>{summary?.importantNote2}</li>
          <li>{summary?.importantNote3}</li>
          <li>{summary?.importantNote4}</li>
        </ul>
      </div>
    </div>
  );
}
