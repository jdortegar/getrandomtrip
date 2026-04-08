/**
 * Avoid list is stored as comma-separated city labels. Grid cards persist
 * {@link canonicalAvoidCityLabel} (city name); the modal must use the same
 * canonical form and treat "City" and "City, Country" as one selection.
 */
export function canonicalAvoidCityLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return t.split(',')[0]?.trim() ?? t;
}

export function avoidCityLabelsEqual(a: string, b: string): boolean {
  return (
    canonicalAvoidCityLabel(a).toLowerCase() ===
    canonicalAvoidCityLabel(b).toLowerCase()
  );
}
