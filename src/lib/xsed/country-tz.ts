/**
 * Maps ISO 3166-1 alpha-2 country codes to a representative IANA timezone.
 * Multi-timezone countries use their most-populated zone.
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
  return COUNTRY_TZ[country.toUpperCase()] ?? null;
}
