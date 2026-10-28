/**
 * Checkout's short date range ("3–7 oct") from a `YYYY-MM-DD` start date and a
 * number of nights, using the summary dictionary's template and month names.
 */
export function formatDatesSummary(
  startDate: string,
  nights: number,
  template: string,
  monthsShort: string[],
): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = monthsShort[start.getMonth()] ?? "";
  const endMonth = monthsShort[end.getMonth()] ?? "";
  return template
    .replace("{startDay}", String(startDay))
    .replace("{endDay}", String(endDay))
    .replace("{startMonth}", startMonth)
    .replace("{endMonth}", endMonth);
}
