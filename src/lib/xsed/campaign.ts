export const DEFAULT_XSED_CAMPAIGN_START_DATE = "2026-09-27";
export const XSED_CAMPAIGN_TIME_ZONE = "America/Argentina/Buenos_Aires";

const DAY_MS = 86_400_000;
const campaignDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: XSED_CAMPAIGN_TIME_ZONE,
  year: "numeric",
});

/** A real Gregorian date, with no time or timezone component. */
export function isCampaignDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith("0000-")
  )
    return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Campaign numbering is independent of each country's purchase window. */
export function getXsedCampaignWeek(
  startDate: string,
  now = new Date(),
): number {
  if (!isCampaignDate(startDate))
    throw new RangeError("Invalid campaign start date");

  const parts = campaignDateFormatter.formatToParts(now);
  const part = (type: "year" | "month" | "day") =>
    parts.find((entry) => entry.type === type)!.value;
  const localDate = `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
  // UTC here represents calendar-day ordinals, not the campaign's midnight.
  // This avoids DST, browser timezone and elapsed-hour rounding differences.
  const days =
    (Date.parse(`${localDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    DAY_MS;
  return Math.max(1, Math.floor(days / 7) + 1);
}
