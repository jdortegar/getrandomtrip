import type { InstagramRecapWindow } from "@/types/instagramRecap";

const DAY_MS = 86_400_000;
/** Argentina is UTC-3 all year (no DST). */
const OFFSET_MS = 3 * 3_600_000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function windowEndingAt(
  localMidnightMs: number,
  days: number,
): InstagramRecapWindow {
  const startLocal = localMidnightMs - days * DAY_MS;
  return {
    start: isoDay(startLocal),
    end: isoDay(localMidnightMs - DAY_MS),
    sinceSec: Math.floor((startLocal + OFFSET_MS) / 1000),
    untilSec: Math.floor((localMidnightMs + OFFSET_MS) / 1000),
  };
}

/**
 * Weekday reports cover yesterday; Monday's covers Fri–Sun so the weekend
 * (and the Sunday Drop) is never skipped. `previous` is the same window
 * one week earlier.
 */
export function getRecapWindows(now: Date = new Date()): {
  current: InstagramRecapWindow;
  previous: InstagramRecapWindow;
} {
  const local = now.getTime() - OFFSET_MS;
  const todayLocal = local - (((local % DAY_MS) + DAY_MS) % DAY_MS);
  const days = new Date(todayLocal).getUTCDay() === 1 ? 3 : 1;
  return {
    current: windowEndingAt(todayLocal, days),
    previous: windowEndingAt(todayLocal - 7 * DAY_MS, days),
  };
}
