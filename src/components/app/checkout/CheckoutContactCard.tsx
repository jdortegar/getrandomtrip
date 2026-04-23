"use client";

import { Sparkle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CheckoutFormFields } from "@/types/Checkout";
import { cn } from "@/lib/utils";

interface CheckoutContactCardProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  formData: CheckoutFormFields;
  isProcessing: boolean;
  onBack: () => void;
  onFieldChange: (field: keyof CheckoutFormFields, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  sessionEmail: string;
  summary: Dictionary["journey"]["summary"];
}

export function CheckoutContactCard({
  checkoutCopy,
  formData,
  isProcessing,
  onBack,
  onFieldChange,
  onSubmit,
  sessionEmail,
  summary,
}: CheckoutContactCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md lg:col-span-1 lg:sticky lg:top-4",
        "ring-1 ring-gray-100",
      )}
    >
      <form className="space-y-8" onSubmit={onSubmit}>
        <h2 className="mb-4 font-barlow-condensed text-4xl font-bold uppercase">
          {checkoutCopy.contactTitle}
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <FormField
              className="disabled:cursor-not-allowed disabled:opacity-80"
              disabled
              id="email"
              label={checkoutCopy.contactEmailLabel}
              readOnly
              type="email"
              value={sessionEmail}
            />
            <p className="mt-1 text-base text-gray-500">
              {checkoutCopy.contactEmailHelper}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="name"
              label={checkoutCopy.contactNameLabel}
              onChange={(event) => onFieldChange("name", event.target.value)}
              required
              type="text"
              value={formData.name}
            />
            <FormField
              id="phone"
              label={checkoutCopy.contactPhoneLabel}
              onChange={(event) => onFieldChange("phone", event.target.value)}
              required
              type="tel"
              value={formData.phone}
            />
            <div className="sm:col-span-2">
              <FormField
                id="id-document"
                label={checkoutCopy.contactIdDocumentLabel}
                onChange={(event) =>
                  onFieldChange("idDocument", event.target.value)
                }
                required
                type="text"
                value={formData.idDocument}
              />
            </div>
          </div>

          <FormField
            id="street"
            label={checkoutCopy.contactStreetLabel}
            onChange={(event) => onFieldChange("street", event.target.value)}
            required
            type="text"
            value={formData.street}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="city"
              label={checkoutCopy.contactCityLabel}
              onChange={(event) => onFieldChange("city", event.target.value)}
              required
              type="text"
              value={formData.city}
            />
            <FormField
              id="state"
              label={checkoutCopy.contactStateLabel}
              onChange={(event) => onFieldChange("state", event.target.value)}
              required
              type="text"
              value={formData.state}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="zipCode"
              label={checkoutCopy.contactZipCodeLabel}
              onChange={(event) => onFieldChange("zipCode", event.target.value)}
              required
              type="text"
              value={formData.zipCode}
            />
            <FormField
              id="country"
              label={checkoutCopy.contactCountryLabel}
              onChange={(event) => onFieldChange("country", event.target.value)}
              required
              type="text"
              value={formData.country}
            />
          </div>
        </div>

        <div className="mt-8 flex w-full gap-4 border-t border-gray-200 pt-6">
          <Button
            className="min-w-0 flex-1 text-sm font-normal normal-case"
            disabled={isProcessing}
            onClick={onBack}
            size="lg"
            type="button"
            variant="ghost"
          >
            {checkoutCopy.volverButton}
          </Button>
          <Button
            className="min-w-0 flex-1"
            disabled={isProcessing}
            size="sm"
            type="submit"
            variant="default"
          >
            {isProcessing ? checkoutCopy.payProcessingButton : checkoutCopy.payButton}
          </Button>
        </div>
      </form>

      <div className="mt-6 rounded-xl bg-neutral-100 p-4 text-sm">
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
