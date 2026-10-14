/**
 * ISO 3166-1 alpha-2 country codes and their localized labels.
 *
 * Nationalities and visas are stored as these codes; labels are produced at
 * render time with `Intl.DisplayNames`, so no country names live in the
 * dictionaries. Free-text names (legacy data, Mapbox) are resolved to codes by
 * `resolveCountryCode` in `./countryNameToCode`.
 */

/** Every officially assigned ISO 3166-1 alpha-2 code (249 countries and territories). */
export const ISO_COUNTRY_CODES: readonly string[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW",
  "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT",
  "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS",
  "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
];

const CODE_SET: ReadonlySet<string> = new Set(ISO_COUNTRY_CODES);

export interface CountryOption {
  /** ISO 3166-1 alpha-2 code. */
  value: string;
  /** Country name in the requested locale. */
  label: string;
}

/** True only for an exact, uppercase ISO 3166-1 alpha-2 code. */
export function isIsoCountryCode(value: unknown): value is string {
  return typeof value === "string" && CODE_SET.has(value);
}

/**
 * Special visa zones accepted alongside ISO country codes. Valid only for
 * visas, never for nationalities. They have no `Intl.DisplayNames` label;
 * callers supply labels from the dictionaries.
 */
export const VISA_ZONE_CODES = ["SCHENGEN"] as const;

export type VisaZoneCode = (typeof VISA_ZONE_CODES)[number];

const VISA_ZONE_SET: ReadonlySet<string> = new Set(VISA_ZONE_CODES);

/** True for an exact, uppercase ISO 3166-1 alpha-2 code or a visa zone code (e.g. `SCHENGEN`). */
export function isVisaCode(value: unknown): value is string {
  return isIsoCountryCode(value) || (typeof value === "string" && VISA_ZONE_SET.has(value));
}

const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

function displayNames(locale: string): Intl.DisplayNames | null {
  if (!displayNamesCache.has(locale)) {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    displayNamesCache.set(locale, names);
  }
  return displayNamesCache.get(locale) ?? null;
}

/** Localized country name for an ISO code; the code itself when no name is available. */
export function countryLabel(code: string, locale: string): string {
  if (!isIsoCountryCode(code)) return code;
  try {
    return displayNames(locale)?.of(code) ?? code;
  } catch {
    return code;
  }
}

const optionsCache = new Map<string, readonly CountryOption[]>();

/** All countries as select options, sorted by localized label. Cached per locale. */
export function countryOptions(locale: string): readonly CountryOption[] {
  const cached = optionsCache.get(locale);
  if (cached) return cached;
  const options = ISO_COUNTRY_CODES.map((code) => ({
    value: code,
    label: countryLabel(code, locale),
  })).sort((a, b) => a.label.localeCompare(b.label, locale));
  optionsCache.set(locale, options);
  return options;
}

function normalizeCodes(
  values: readonly string[],
  isValid: (code: string) => boolean,
): string[] {
  const result: string[] = [];
  for (const value of values) {
    const code = value.trim().toUpperCase();
    if (isValid(code) && !result.includes(code)) result.push(code);
  }
  return result;
}

/** Trims, uppercases and dedupes (first occurrence wins); drops anything that is not an ISO code. */
export function normalizeCountryCodes(values: readonly string[]): string[] {
  return normalizeCodes(values, isIsoCountryCode);
}

/** Like `normalizeCountryCodes`, but also keeps visa zone codes such as `SCHENGEN`. */
export function normalizeVisaCodes(values: readonly string[]): string[] {
  return normalizeCodes(values, isVisaCode);
}
