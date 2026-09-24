import { hasFlag } from "country-flag-icons";

function normalizeCountryCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(code) && hasFlag(code) ? code : null;
}

/**
 * Country to welcome the visitor from: the Netlify `x-country` header
 * (IP-based ISO 3166-1 alpha-2), or a `?country=XX` override when allowed
 * (non-production only). Returns null for missing or unknown codes.
 */
export function resolveWelcomeCountry(input: {
  allowOverride: boolean;
  headerCountry?: string | null;
  overrideCountry?: string | null;
}): string | null {
  const override = input.allowOverride
    ? normalizeCountryCode(input.overrideCountry)
    : null;
  return override ?? normalizeCountryCode(input.headerCountry);
}

/** Localized country name, e.g. ("DE", "es") → "Alemania". */
export function getWelcomeCountryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
