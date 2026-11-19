"use client";

import { useMemo } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { countryLabel, countryOptions } from "@/lib/geo/countryOptions";

interface ProfileCountryOptionsProps {
  locale: string;
  placeholder: string;
  selected: string;
}

/**
 * `<option>`s for a country select. Server and browser ICU sort and name some
 * countries differently, so the server renders only the placeholder and the
 * selected country; the full sorted list appears after hydration.
 */
export function ProfileCountryOptions({ locale, placeholder, selected }: ProfileCountryOptionsProps) {
  const isHydrated = useHydrated();
  const countries = useMemo(() => (isHydrated ? countryOptions(locale) : []), [isHydrated, locale]);

  return (
    <>
      <option value="">{placeholder}</option>
      {isHydrated ? (
        countries.map((country) => (
          <option key={country.value} value={country.value}>
            {country.label}
          </option>
        ))
      ) : selected ? (
        <option suppressHydrationWarning value={selected}>
          {countryLabel(selected, locale)}
        </option>
      ) : null}
    </>
  );
}
