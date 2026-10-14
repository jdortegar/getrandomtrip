"use client";

import { useMemo } from "react";

import { CountryMultiSelect } from "@/components/ui/CountryMultiSelect";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { CountryOption } from "@/lib/geo/countryOptions";
import { cn } from "@/lib/utils";
import type { TravelerDocuments } from "@/types/traveler";

interface TravelerDocumentsFieldsProps {
  /** Prefix for the pickers' ids: `<idPrefix>-nationalities` / `<idPrefix>-visas`. */
  idPrefix: string;
  locale: string;
  value: TravelerDocuments;
  onChange: (next: TravelerDocuments) => void;
  nationalitiesReadOnly?: boolean;
  visasReadOnly?: boolean;
  /** Shows the "add at least one nationality" error under the nationality picker. */
  showNationalitiesRequired?: boolean;
  /** Shows the profile helper copy under each picker (written to the traveler as "you"). */
  showHelpers?: boolean;
  className?: string;
}

function copyFor(locale: string) {
  const dict = locale.startsWith("en") ? enCopy : esCopy;
  return {
    labels: dict.profile.labels,
    nationalitiesLabel: dict.profile.sections.nationalities,
    nationalitiesRequired: dict.journey.checkout.errors.nationalitiesRequired,
  };
}

/**
 * Nationality and visa pickers for a trip traveler (roster rows and the
 * companion invite form). Same wiring as the checkout travel documents card:
 * ISO codes, the `SCHENGEN` visa zone and localized remove labels.
 */
export function TravelerDocumentsFields({
  idPrefix,
  locale,
  value,
  onChange,
  nationalitiesReadOnly = false,
  visasReadOnly = false,
  showNationalitiesRequired = false,
  showHelpers = false,
  className,
}: TravelerDocumentsFieldsProps) {
  const copy = copyFor(locale);
  const { labels } = copy;
  const visaZoneOptions = useMemo<CountryOption[]>(
    () => [{ value: "SCHENGEN", label: labels.schengenVisa }],
    [labels.schengenVisa],
  );
  const removeCountryLabel = (country: string) =>
    labels.removeCountry.replace("{country}", country);

  return (
    <div
      className={cn("grid grid-cols-1 gap-4", className)}
      data-component="TravelerDocumentsFields"
    >
      <div className="flex flex-col gap-2">
        <CountryMultiSelect
          emptyLabel={labels.noNationalities}
          error={
            showNationalitiesRequired && value.nationalities.length === 0
              ? copy.nationalitiesRequired
              : undefined
          }
          id={`${idPrefix}-nationalities`}
          label={copy.nationalitiesLabel}
          locale={locale}
          noResultsLabel={labels.noCountryResults}
          onChange={(nationalities) => onChange({ ...value, nationalities })}
          placeholder={labels.selectNationalities}
          readOnly={nationalitiesReadOnly}
          removeLabel={removeCountryLabel}
          searchPlaceholder={labels.searchCountry}
          value={value.nationalities}
        />
        {showHelpers && (
          <p className="text-sm text-gray-500">{labels.nationalitiesHelper}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <CountryMultiSelect
          emptyLabel={labels.noVisas}
          extraOptions={visaZoneOptions}
          id={`${idPrefix}-visas`}
          label={labels.approvedVisas}
          locale={locale}
          noResultsLabel={labels.noCountryResults}
          onChange={(visas) => onChange({ ...value, visas })}
          placeholder={labels.selectVisas}
          readOnly={visasReadOnly}
          removeLabel={removeCountryLabel}
          searchPlaceholder={labels.searchVisa}
          value={value.visas}
        />
        {showHelpers && (
          <p className="text-sm text-gray-500">{labels.approvedVisasHelper}</p>
        )}
      </div>
    </div>
  );
}
