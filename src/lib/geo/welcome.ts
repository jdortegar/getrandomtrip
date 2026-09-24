import { hasFlag } from "country-flag-icons";

/** localStorage key holding the last country the visitor was welcomed from. */
export const WELCOME_COUNTRY_STORAGE_KEY = "rt-welcome-country";

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

/** Welcome on the first visit and again whenever the country changes. */
export function shouldShowWelcome(
  country: string,
  lastWelcomedCountry: string | null,
): boolean {
  return country !== lastWelcomedCountry;
}
