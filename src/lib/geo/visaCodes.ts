/**
 * Resolution of free-text visa and nationality values (legacy English
 * `VISA_COUNTRIES` names, es/en country names, raw codes) to the stored codes:
 * ISO 3166-1 alpha-2 for countries plus visa zone codes such as `SCHENGEN`.
 */
import { resolveCountryCode } from "./countryNameToCode";
import { isIsoCountryCode, isVisaCode } from "./countryOptions";

/** Lowercases, strips accents and collapses whitespace for spelling comparison. */
const normalizeSpelling = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Known spellings of the Schengen zone; "schengena" is the typo stored by the old list. */
const SCHENGEN_SPELLINGS: ReadonlySet<string> = new Set(
  ["Schengena", "Schengen", "Schengen Area", "Espacio Schengen", "Zona Schengen"].map(
    normalizeSpelling,
  ),
);

/** ISO code for a country value (code in any case, or an es/en name); null otherwise. */
export function resolveNationalityCode(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (isIsoCountryCode(upper)) return upper;
  const code = resolveCountryCode(trimmed);
  return isIsoCountryCode(code) ? code : null;
}

/** Visa code for a value: an ISO country code or `SCHENGEN`; null when unknown. */
export function resolveVisaCode(value: string): string | null {
  if (!value.trim()) return null;
  if (SCHENGEN_SPELLINGS.has(normalizeSpelling(value))) return "SCHENGEN";
  const code = resolveNationalityCode(value);
  return isVisaCode(code) ? code : null;
}

/**
 * Converts stored visa values to deduped visa codes in input order.
 * Values that cannot be resolved are left out of `codes` and listed (trimmed)
 * in `unresolved`; blank values are ignored.
 */
export function toVisaCodes(values: readonly string[]): {
  codes: string[];
  unresolved: string[];
} {
  const codes: string[] = [];
  const unresolved: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const code = resolveVisaCode(value);
    if (!code) unresolved.push(value);
    else if (!codes.includes(code)) codes.push(code);
  }
  return { codes, unresolved };
}
