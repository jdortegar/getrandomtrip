/**
 * Generates a URL-safe slug in the format `YYYY-MM-DD-city-slug`.
 *
 * @param tripDate - ISO date string (YYYY-MM-DD portion is used)
 * @param city - destination city name; falls back to "unknown" when empty
 * @returns slug string, e.g. "2025-01-05-buenos-aires"
 */
export function generateSlug(tripDate: string, city: string): string {
  const datePart = tripDate.slice(0, 10); // take YYYY-MM-DD
  const rawCity = city.trim() || "unknown";

  const citySlug = rawCity
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens

  return `${datePart}-${citySlug}`;
}
