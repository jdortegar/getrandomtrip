import { getCountdownTarget } from "@/lib/xsed/window";

export const DEFAULT_XSED_CAMPAIGN_START_DATE = "2026-09-27";
export const XSED_CAMPAIGN_TIME_ZONE = "America/Argentina/Buenos_Aires";

const DAY_MS = 86_400_000;

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

/** Number the active/upcoming Sunday shown by the countdown, not elapsed weeks. */
export function getXsedCampaignWeek(
  startDate: string,
  now = new Date(),
  timeZone = XSED_CAMPAIGN_TIME_ZONE,
): number {
  if (!isCampaignDate(startDate))
    throw new RangeError("Invalid campaign start date");

  const target = getCountdownTarget(timeZone, now);
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(target);
  const part = (type: "year" | "month" | "day") =>
    parts.find((entry) => entry.type === type)!.value;
  const localDate = `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
  // Calendar-day ordinals avoid DST rounding; the first Sunday on or after
  // the configured date is edition 1. Pre-launch editions stay clamped to 1.
  const days =
    (Date.parse(`${localDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    DAY_MS;
  return Math.max(1, Math.floor(days / 7) + 1);
}
