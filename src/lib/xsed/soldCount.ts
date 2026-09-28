import { findCountryByName } from "@/lib/data/shared/countries";
import { getCountryCode } from "@/lib/helpers/flags";
import { countryToTimezone } from "@/lib/xsed/country-tz";
import {
  DROP_DAY_OF_WEEK,
  LOCAL_WINDOW_END_HOUR,
  LOCAL_WINDOW_START_HOUR,
} from "@/lib/xsed/window";

/** Legacy origins are localized names or ISO codes, not an immutable market key. */
export function countCountryTrips(
  trips: ReadonlyArray<{ originCountry: string }>,
  country: string,
): number {
  return trips.filter(({ originCountry }) => {
    const code =
      findCountryByName(originCountry)?.code ?? getCountryCode(originCountry);
    return code === country && countryToTimezone(code) !== null;
  }).length;
}

/** Display-only progression, not a paid-sales count or a capacity reservation. */
export function computeDisplayedSold(
  realCount: number,
  totalSlots: number,
  country: string,
  now: Date,
): number {
  const timeZone = countryToTimezone(country);
  if (!timeZone) throw new Error("Unsupported XSED country");
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    minute: "numeric",
    timeZone,
    weekday: "short",
  }).formatToParts(now);
  const value = (type: "hour" | "minute" | "weekday") =>
    parts.find((part) => part.type === type)!.value;
  const dropDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    DROP_DAY_OF_WEEK
  ];
  const elapsedMinutes =
    value("weekday") === dropDay
      ? Number(value("hour")) * 60 +
        Number(value("minute")) -
        LOCAL_WINDOW_START_HOUR * 60
      : 0;
  // Keep Sunday's result after the canonical close while western zones are open.
  // Never carry last week's automatic increments into an upcoming window.
  const windowMinutes = (LOCAL_WINDOW_END_HOUR - LOCAL_WINDOW_START_HOUR) * 60;
  const autoIncrements = Math.floor(
    Math.max(0, Math.min(windowMinutes, elapsedMinutes)) / 20,
  );
  return Math.min(totalSlots, realCount + autoIncrements);
}
