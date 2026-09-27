/** Travel dates represent calendar days, not local event timestamps. */
export function formatTripCalendarDate(
  iso: string | null,
  locale: string,
): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
}
