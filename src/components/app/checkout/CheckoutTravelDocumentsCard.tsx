"use client";

import { useMemo } from "react";

import { CountryMultiSelect } from "@/components/ui/CountryMultiSelect";
import type { CountryOption } from "@/lib/geo/countryOptions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { BuyerTravelDocuments } from "@/types/documents";

interface CheckoutTravelDocumentsCardProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  /** Country picker labels shared with the profile Documents tab. */
  profileCopy: Dictionary["profile"];
  locale: string;
  value: BuyerTravelDocuments;
  onChange: (next: BuyerTravelDocuments) => void;
  /** Shows the required-nationality error once the buyer tried to pay. */
  showErrors: boolean;
  readOnly?: boolean;
}

export function CheckoutTravelDocumentsCard({
  checkoutCopy,
  profileCopy,
  locale,
  value,
  onChange,
  showErrors,
  readOnly = false,
}: CheckoutTravelDocumentsCardProps) {
  const labels = profileCopy.labels;
  const visaZoneOptions = useMemo<CountryOption[]>(
    () => [{ value: "SCHENGEN", label: labels.schengenVisa }],
    [labels.schengenVisa],
  );
  const removeCountryLabel = (country: string) =>
    labels.removeCountry.replace("{country}", country);
  const nationalitiesError =
    showErrors && value.nationalities.length === 0
      ? checkoutCopy.errors.nationalitiesRequired
      : undefined;

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

      <div className="flex flex-col gap-2">
        <CountryMultiSelect
          emptyLabel={labels.noNationalities}
          error={nationalitiesError}
          id="checkout-nationalities"
          label={profileCopy.sections.nationalities}
          locale={locale}
          noResultsLabel={labels.noCountryResults}
          onChange={(nationalities) => onChange({ ...value, nationalities })}
          placeholder={labels.selectNationalities}
          readOnly={readOnly}
          removeLabel={removeCountryLabel}
          searchPlaceholder={labels.searchCountry}
          value={value.nationalities}
        />
        <p className="text-sm text-gray-500">{labels.nationalitiesHelper}</p>
      </div>

      <div className="flex flex-col gap-2">
        <CountryMultiSelect
          emptyLabel={labels.noVisas}
          extraOptions={visaZoneOptions}
          id="checkout-visas"
          label={labels.approvedVisas}
          locale={locale}
          noResultsLabel={labels.noCountryResults}
          onChange={(visas) => onChange({ ...value, visas })}
          placeholder={labels.selectVisas}
          readOnly={readOnly}
          removeLabel={removeCountryLabel}
          searchPlaceholder={labels.searchVisa}
          value={value.visas}
        />
        <p className="text-sm text-gray-500">{labels.approvedVisasHelper}</p>
      </div>
    </div>
  );
}
