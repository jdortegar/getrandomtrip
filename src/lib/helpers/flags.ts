import { countryToAlpha2 } from 'country-to-iso';

/**
 * Flag utilities from country-flag-icons (lightweight, 0 deps).
 * Use CountryFlag component for UI; use these for logic (e.g. validation, labels).
 */
export { hasFlag } from 'country-flag-icons';
export { default as getUnicodeFlagIcon } from 'country-flag-icons/unicode';

/** Overrides for names not in country-to-iso (e.g. Spanish). Prefer storing countryCode in data when possible. */
const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  españa: 'ES',
  perú: 'PE',
};

/**
 * Returns ISO 3166-1 alpha-2 code from country name or passthrough if already a 2-letter code.
 * Supports all countries via country-to-iso; overrides for Spanish names (España, Perú, etc.).
 * Use countryCode in data when possible; use this when only the name is available.
 */
export function getCountryCode(nameOrCode: string): string | null {
  const s = nameOrCode?.trim();
  if (!s) return null;
  if (s.length === 2) return s.toUpperCase();
  const lower = s.toLowerCase();
  const override = COUNTRY_NAME_OVERRIDES[lower];
  if (override) return override;
  const code = countryToAlpha2(s);
  return code ?? null;
}
