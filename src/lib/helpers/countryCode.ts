import { AMERICAN_COUNTRIES } from "@/lib/data/shared/countries";

/** Converts a stored country value (full name or code) to a 2-letter ISO code. */
export function normalizeCountryToCode(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (AMERICAN_COUNTRIES.some((c) => c.code === upper)) return upper;
  const byName = AMERICAN_COUNTRIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return byName ? byName.code : "";
}
