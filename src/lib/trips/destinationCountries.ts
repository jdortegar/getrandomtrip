import { AMERICAN_COUNTRIES, getCountryByCode } from "@/lib/data/shared/countries";

/**
 * "country" on a TripDocument is the document's DESTINATION country, not a
 * closed traveler-market list (design.md ADR-5, resolved_decisions[6]).
 * Derived, never hand-written — order matches the catalog for stable
 * <select> options. This makes list-vs-catalog drift impossible by
 * construction; the remaining drift risk is i18n label coverage, guarded by
 * the accompanying `common.countries` unit test.
 */
export const DESTINATION_COUNTRY_CODES: string[] = AMERICAN_COUNTRIES.map(
  (c) => c.code,
);

/** True iff `value` is a code present in AMERICAN_COUNTRIES. Case-sensitive. */
export function isDestinationCountryCode(value: unknown): value is string {
  if (typeof value !== "string" || value === "") return false;
  return getCountryByCode(value) !== undefined;
}
