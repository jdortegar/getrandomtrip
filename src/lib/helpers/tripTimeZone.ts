import { resolveCountryCode } from "@/lib/geo/countryNameToCode";
import { countryToTimezone } from "@/lib/xsed/country-tz";
import type { LocalDateTime } from "@/types/core";

/** Last-resort departure zone: the platform's home market. */
export const DEFAULT_DEPARTURE_TIME_ZONE = "America/Argentina/Buenos_Aires";

/**
 * Margin for Prisma `startDate` candidate windows. Departure is local midnight
 * of the start date, so the real instant is within UTC-12..UTC+14 of the stored
 * UTC midnight; one day on each side is a conservative superset. Always
 * re-filter candidates in memory with the exact helper.
 */
export const ZONE_QUERY_MARGIN_MS = 24 * 60 * 60 * 1000;

/** True when `value` is an IANA zone the runtime's Intl database knows. */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Offset (ms) of `timeZone` from UTC at the UTC instant `ms`: local - UTC. */
function offsetAt(ms: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(ms))) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/**
 * Converts a wall-clock time in `timeZone` to the UTC instant. Day/month
 * overflow is normalized (day 0 is the last day of the previous month), so
 * callers can subtract calendar days directly. A wall time that does not exist
 * (spring-forward gap) resolves to the instant right after the gap; an
 * ambiguous one (fall-back) resolves to the first occurrence.
 */
export function localTimeToUtc(
  { year, month, day, hour = 0, minute = 0 }: LocalDateTime,
  timeZone: string,
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const firstOffset = offsetAt(wall, timeZone);
  const first = wall - firstOffset;
  const secondOffset = offsetAt(first, timeZone);
  if (secondOffset === firstOffset) return new Date(first);
  const second = wall - secondOffset;
  if (offsetAt(second, timeZone) === secondOffset) {
    // Both candidates are valid only in a fall-back overlap: take the earlier.
    return new Date(Math.min(first, second));
  }
  // Nonexistent wall time: land after the gap.
  return new Date(Math.max(first, second));
}

/**
 * The ONE resolver for a trip's departure zone: origin country zone, else the
 * browser's zone (validated), else Buenos Aires. Unknown inputs fall through.
 */
export function resolveDepartureTimeZone(input: {
  originCountryCode?: string | null;
  browserTimeZone?: string | null;
}): string {
  const fromCountry = input.originCountryCode
    ? countryToTimezone(input.originCountryCode)
    : null;
  if (fromCountry && isValidTimeZone(fromCountry)) return fromCountry;
  if (isValidTimeZone(input.browserTimeZone)) return input.browserTimeZone;
  console.warn(
    `[trip-timezone] No usable origin country or browser zone (country=${input.originCountryCode ?? "none"}); defaulting to ${DEFAULT_DEPARTURE_TIME_ZONE}`,
  );
  return DEFAULT_DEPARTURE_TIME_ZONE;
}

/**
 * Zone inputs every booking client sends with the trip request, so the server
 * resolves `departureTimeZone` through `resolveDepartureTimeZone`. Safe to call
 * in the browser; the browser zone is omitted if Intl cannot provide a valid one.
 */
export function getBookingTimeZoneInputs(origin: {
  countryCode?: string | null;
  countryName?: string | null;
}): { originCountryCode?: string; browserTimeZone?: string } {
  const code =
    origin.countryCode?.trim().toUpperCase() ||
    resolveCountryCode(origin.countryName);
  let browserTimeZone: string | undefined;
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isValidTimeZone(zone)) browserTimeZone = zone;
  } catch {
    browserTimeZone = undefined;
  }
  return {
    ...(code ? { originCountryCode: code } : {}),
    ...(browserTimeZone ? { browserTimeZone } : {}),
  };
}
