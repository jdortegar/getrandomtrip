"use client";

import { TravelerDocumentsFields } from "@/components/app/travelers/TravelerDocumentsFields";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { BuyerTravelDocuments } from "@/types/documents";

interface CheckoutTravelDocumentsCardProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  /**
   * @deprecated Unused: the pickers read the same profile labels through
   * `TravelerDocumentsFields`. Kept so existing callers still type-check.
   */
  profileCopy?: Dictionary["profile"];
  locale: string;
  value: BuyerTravelDocuments;
  onChange: (next: BuyerTravelDocuments) => void;
  /** Shows the required-nationality error once the buyer tried to pay. */
  showErrors: boolean;
  readOnly?: boolean;
}

export function CheckoutTravelDocumentsCard({
  checkoutCopy,
  locale,
  value,
  onChange,
  showErrors,
  readOnly = false,
}: CheckoutTravelDocumentsCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-md",
        "ring-1 ring-gray-100",
      )}
      data-component="CheckoutTravelDocumentsCard"
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-barlow-condensed text-4xl font-bold uppercase">
          {checkoutCopy.travelDocumentsTitle}
        </h2>
        <p className="text-sm text-gray-500">
          {checkoutCopy.travelDocumentsDescription}
        </p>
      </div>

      <TravelerDocumentsFields
        className="gap-6"
        idPrefix="checkout"
        locale={locale}
        nationalitiesReadOnly={readOnly}
        onChange={onChange}
        showHelpers
        showNationalitiesRequired={showErrors}
        value={value}
        visasReadOnly={readOnly}
      />
    </div>
  );
}
