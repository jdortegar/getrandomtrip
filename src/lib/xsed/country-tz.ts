/**
 * Maps ISO 3166-1 alpha-2 country codes to a representative IANA timezone.
 * Multi-timezone countries use their most-populated zone.
 * This is also the shared automatic counter clock for everyone in that country,
 * independent of the visitor-local countdown.
 * Used by the server gate on /xsed/book to validate the booking window
 * from the Netlify x-country header.
 */
export const COUNTRY_TZ: Record<string, string> = {
  AR: "America/Argentina/Buenos_Aires",
  BO: "America/La_Paz",
  BR: "America/Sao_Paulo",
  CL: "America/Santiago",
  CO: "America/Bogota",
  CR: "America/Costa_Rica",
  CU: "America/Havana",
  DO: "America/Santo_Domingo",
  EC: "America/Guayaquil",
  SV: "America/El_Salvador",
  GT: "America/Guatemala",
  HT: "America/Port-au-Prince",
  HN: "America/Tegucigalpa",
  JM: "America/Jamaica",
  MX: "America/Mexico_City",
  NI: "America/Managua",
  PA: "America/Panama",
  PY: "America/Asuncion",
  PE: "America/Lima",
  PR: "America/Puerto_Rico",
  UY: "America/Montevideo",
  VE: "America/Caracas",
};

/** Returns the IANA timezone for `country` (ISO alpha-2), or null if not in LATAM list. */
export function countryToTimezone(country: string): string | null {
  const code = country.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && Object.hasOwn(COUNTRY_TZ, code)
    ? COUNTRY_TZ[code]!
    : null;
}

const ADDITIONAL_COUNTRY_TIMEZONES: Record<string, string[]> = {
  AR: [
    "America/Argentina/Cordoba",
    "America/Argentina/Salta",
    "America/Argentina/Jujuy",
    "America/Argentina/Tucuman",
    "America/Argentina/Catamarca",
    "America/Argentina/La_Rioja",
    "America/Argentina/San_Juan",
    "America/Argentina/Mendoza",
    "America/Argentina/San_Luis",
    "America/Argentina/Rio_Gallegos",
    "America/Argentina/Ushuaia",
  ],
  BR: [
    "America/Belem",
    "America/Fortaleza",
    "America/Recife",
    "America/Araguaina",
    "America/Maceio",
    "America/Bahia",
    "America/Cuiaba",
    "America/Porto_Velho",
    "America/Boa_Vista",
    "America/Manaus",
    "America/Eirunepe",
    "America/Rio_Branco",
    "America/Noronha",
  ],
  CL: ["America/Punta_Arenas"],
  MX: [
    "America/Cancun",
    "America/Monterrey",
    "America/Merida",
    "America/Bahia_Banderas",
    "America/Mazatlan",
    "America/Hermosillo",
    "America/Chihuahua",
    "America/Ojinaga",
    "America/Tijuana",
  ],
};

const TIMEZONE_COUNTRY: Record<string, string> = Object.fromEntries([
  ...Object.entries(COUNTRY_TZ).map(([country, timezone]) => [
    timezone,
    country,
  ]),
  ...Object.entries(ADDITIONAL_COUNTRY_TIMEZONES).flatMap(
    ([country, timezones]) => timezones.map((timezone) => [timezone, country]),
  ),
]);

/** Unknown browser zones have no inventory market, never an Argentina fallback. */
export function timezoneToCountry(timezone: string | null): string | null {
  return timezone && Object.hasOwn(TIMEZONE_COUNTRY, timezone)
    ? TIMEZONE_COUNTRY[timezone]!
    : null;
}

/**
 * True when the country spans timezones with different offsets, so its primary
 * zone is only a best guess. Argentina's provincial zones all share UTC-3, so
 * Buenos Aires is exact for every Argentine departure.
 */
export function isMultiTimezoneCountry(country: string): boolean {
  const code = country.trim().toUpperCase();
  return code !== "AR" && Object.hasOwn(ADDITIONAL_COUNTRY_TIMEZONES, code);
}
