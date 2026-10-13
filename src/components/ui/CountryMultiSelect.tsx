"use client";

import { useId, useMemo } from "react";
import type { ReactNode } from "react";
import RemovableTag from "@/components/RemovableTag";
import { MultiSelectInput } from "@/components/ui/MultiSelectInput";
import {
  countryLabel,
  countryOptions,
  type CountryOption,
} from "@/lib/geo/countryOptions";

interface CountryMultiSelectProps {
  id?: string;
  label?: ReactNode;
  /** UI locale for country names and sort order ("es" | "en"). */
  locale: string;
  /** Selected ISO 3166-1 alpha-2 codes (plus any `extraOptions` codes). */
  value: string[];
  /**
   * Already-labeled options listed before the countries, e.g. visa zones
   * (`{ value: "SCHENGEN", label: dict.schengen }`). Labels come from the caller.
   */
  extraOptions?: readonly CountryOption[];
  onChange: (codes: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResultsLabel: string;
  /** Shown instead of chips in read-only mode when nothing is selected. */
  emptyLabel?: string;
  hint?: string;
  /** Validation message from the caller (e.g. "select at least one"). */
  error?: string;
  /** Renders the selection as plain chips, without the picker or remove buttons. */
  readOnly?: boolean;
  triggerClassName?: string;
  /** Accessible name for a chip's remove button, from the country label. */
  removeLabel?: (countryLabel: string) => string;
}

/**
 * Searchable multi-select of every ISO country, labelled with
 * `Intl.DisplayNames` in the UI locale. All copy comes from the caller.
 */
export function CountryMultiSelect({
  id,
  label,
  locale,
  value,
  extraOptions,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsLabel,
  emptyLabel,
  hint,
  error,
  readOnly = false,
  triggerClassName,
  removeLabel,
}: CountryMultiSelectProps) {
  const errorId = useId();
  const options = useMemo(
    () => [...(extraOptions ?? []), ...countryOptions(locale)],
    [extraOptions, locale],
  );
  const labelFor = (code: string) =>
    extraOptions?.find((option) => option.value === code)?.label ??
    countryLabel(code, locale);

  const errorMessage = error ? (
    <p className="text-red-700 text-sm" id={errorId} role="alert">
      {error}
    </p>
  ) : null;

  if (readOnly) {
    return (
      <div className="flex flex-col gap-2" data-component="CountryMultiSelect">
        {label && (
          <span className="block font-normal text-gray-600 text-base">
            {label}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          {value.length === 0 ? (
            emptyLabel && (
              <p className="text-sm italic text-neutral-400">{emptyLabel}</p>
            )
          ) : (
            value.map((code) => (
              <RemovableTag
                color="secondary"
                item={{ key: code, value: labelFor(code) }}
                key={code}
                size="sm"
              />
            ))
          )}
        </div>
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-component="CountryMultiSelect">
      <MultiSelectInput
        emptyLabel={noResultsLabel}
        hint={hint}
        id={id}
        label={label}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        removeLabel={removeLabel}
        searchPlaceholder={searchPlaceholder}
        triggerClassName={triggerClassName}
        value={value}
      />
      {errorMessage}
    </div>
  );
}
