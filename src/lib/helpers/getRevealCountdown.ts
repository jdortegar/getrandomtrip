/**
 * Trip clock helpers for the destination reveal flow.
 *
 * Trip dates are calendar dates stored at UTC midnight. Every deadline is
 * anchored to the trip's departure zone: departure is 00:00 of the start
 * calendar date there, and the reveal opens at 09:00 local two calendar days
 * before. Callers pass a fixed `now` so each function is deterministic.
 */
import {
  DEFAULT_DEPARTURE_TIME_ZONE,
  isValidTimeZone,
  localTimeToUtc,
} from "@/lib/helpers/tripTimeZone";
import type { TripTiming } from "@/types/core";

const REVEAL_LOCAL_HOUR = 9;
const REVEAL_DAYS_BEFORE_DEPARTURE = 2;

export interface RevealCountdown {
  revealed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Countdown {
  elapsed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** The existing day/hour/minute/second arithmetic, extracted so it can be
 * reused for any target instant — the reveal moment (48h before departure)
 * or departure itself (design.md ADR-5). Zero behavior change. */
function countdownTo(target: Date, now: Date): Countdown {
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { elapsed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { elapsed: false, days, hours, minutes, seconds };
}

/**
 * A stored zone Intl does not recognise (hand-edited row, older tz data) falls
 * back to Buenos Aires so one bad trip can never abort a whole cron batch.
 */
function zoneOf(trip: TripTiming): string {
  return isValidTimeZone(trip.departureTimeZone)
    ? trip.departureTimeZone
    : DEFAULT_DEPARTURE_TIME_ZONE;
}

/** Invalid start dates yield an invalid Date (as the old arithmetic did) instead of throwing. */
function hasValidStart(trip: TripTiming): boolean {
  return !Number.isNaN(trip.startDate.getTime());
}

/** 00:00 of the trip's start calendar date (UTC date part) in its departure zone. */
export function getDepartureAt(trip: TripTiming): Date {
  if (!hasValidStart(trip)) return new Date(Number.NaN);
  const { startDate } = trip;
  return localTimeToUtc(
    {
      year: startDate.getUTCFullYear(),
      month: startDate.getUTCMonth() + 1,
      day: startDate.getUTCDate(),
    },
    zoneOf(trip),
  );
}

/** 09:00 departure-local on the calendar day two days before departure. */
export function getRevealAt(trip: TripTiming): Date {
  if (!hasValidStart(trip)) return new Date(Number.NaN);
  const { startDate } = trip;
  return localTimeToUtc(
    {
      year: startDate.getUTCFullYear(),
      month: startDate.getUTCMonth() + 1,
      day: startDate.getUTCDate() - REVEAL_DAYS_BEFORE_DEPARTURE,
      hour: REVEAL_LOCAL_HOUR,
    },
    zoneOf(trip),
  );
}

/** First admin assignment reminder instant, 72h before reveal. */
export function getNotifyAt(trip: TripTiming): Date {
  return new Date(getRevealAt(trip).getTime() - 72 * 60 * 60 * 1000);
}

/** True from the reveal moment (inclusive) until departure. */
export function isInRevealWindow(trip: TripTiming, now: Date): boolean {
  return now >= getRevealAt(trip) && now < getDepartureAt(trip);
}

/** True during the 72h assignment-reminder window before reveal. */
export function isInNotifyWindow(trip: TripTiming, now: Date): boolean {
  return now >= getNotifyAt(trip) && now < getRevealAt(trip);
}

/** Countdown until the reveal moment. */
export function getRevealCountdown(
  trip: TripTiming,
  now: Date,
): RevealCountdown {
  const { elapsed, ...rest } = countdownTo(getRevealAt(trip), now);
  return { revealed: elapsed, ...rest };
}

/**
 * Countdown to departure itself (local midnight of the start date) — a
 * different axis than `getRevealCountdown`. `elapsed: true` once the trip has
 * started. Composes `countdownTo` (design.md ADR-5).
 */
export function getDepartureCountdown(trip: TripTiming, now: Date): Countdown {
  return countdownTo(getDepartureAt(trip), now);
}

/**
 * Calendar-day gap to departure, UTC-anchored to match how trip dates are
 * displayed elsewhere (`formatDateRange` renders with `timeZone: "UTC"`).
 * Deliberately NOT `getDepartureCountdown(...).days` — that field is a
 * floor of the exact elapsed-time delta into 24h chunks, so a trip
 * departing tomorrow at UTC midnight reads as "0 days" (and thus "today")
 * for anyone less than 24 exact hours out, even mid-afternoon the day
 * before. This instead answers "how many UTC calendar days from now until
 * the departure date", which is what a "Departs today" / "Departs in N
 * days" badge actually promises next to a "Sat, Aug 15" date label.
 */
export function getCalendarDaysUntilDeparture(startDate: Date, now: Date): number {
  const startUtcMidnight = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );
  const nowUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((startUtcMidnight - nowUtcMidnight) / (24 * 60 * 60 * 1000));
}
