// ============================================================================
// Display currency config — country → local currency, cookie name
// Prices are always charged in USD; local currencies are display-only.
// ============================================================================

export const COOKIE_DISPLAY_CURRENCY = "GRT_DISPLAY_CURRENCY";

export const BASE_CURRENCY = "USD";

const EURO_COUNTRIES = [
  "AD", "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE",
  "IT", "LT", "LU", "LV", "MC", "ME", "MT", "NL", "PT", "SI", "SK", "SM",
  "VA",
];

const COUNTRY_CURRENCY: Record<string, string> = {
  // Americas
  AR: "ARS", BO: "BOB", BR: "BRL", CA: "CAD", CL: "CLP", CO: "COP",
  CR: "CRC", DO: "DOP", GT: "GTQ", HN: "HNL", MX: "MXN", NI: "NIO",
  PE: "PEN", PY: "PYG", UY: "UYU",
  // Europe (non-euro)
  CH: "CHF", CZ: "CZK", DK: "DKK", GB: "GBP", HU: "HUF", IS: "ISK",
  NO: "NOK", PL: "PLN", RO: "RON", SE: "SEK", TR: "TRY",
  // Asia / Oceania / Africa
  AE: "AED", AU: "AUD", CN: "CNY", HK: "HKD", IL: "ILS", IN: "INR",
  JP: "JPY", KR: "KRW", NZ: "NZD", SG: "SGD", TH: "THB", ZA: "ZAR",
  ...Object.fromEntries(EURO_COUNTRIES.map((code) => [code, "EUR"])),
};

/**
 * Local currency for an ISO 3166-1 alpha-2 country, or null when the country
 * uses USD (US, EC, PA, SV, …) or isn't mapped — the selector hides then.
 */
export function currencyForCountry(country: string | null): string | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? null;
}
