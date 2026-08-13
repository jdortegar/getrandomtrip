/**
 * getRevealCountdown — pure countdown helper for the destination reveal flow.
 *
 * The reveal window opens 48 hours before the trip's startDate.
 * All math is in UTC. Callers pass a fixed `now` so the function is
 * deterministic and unit-testable without mocking Date.
 */

const REVEAL_OFFSET_MS = 48 * 60 * 60 * 1000; // 48h in ms

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
 * Returns the Date at which the destination will be revealed
 * (startDate minus 48 hours, in UTC).
 */
export function getRevealAt(startDate: Date): Date {
  return new Date(startDate.getTime() - REVEAL_OFFSET_MS);
}

/**
 * Returns the Date at which the T-72h admin assignment reminder should fire
 * (startDate minus 72 hours, in UTC).
 */
export function getNotifyAt(startDate: Date): Date {
  return new Date(startDate.getTime() - 3 * 60 * 60 * 1000 * 24);
}

/**
 * Returns true when `now` is inside the 48h reveal window
 * (i.e. startDate - 48h <= now < startDate).
 */
export function isInRevealWindow(startDate: Date, now: Date): boolean {
  const revealAt = getRevealAt(startDate);
  return now >= revealAt && now < startDate;
}

/**
 * Returns true when `now` is inside the 72h notification window
 * (i.e. startDate - 72h <= now < startDate).
 */
export function isInNotifyWindow(startDate: Date, now: Date): boolean {
  const notifyAt = getNotifyAt(startDate);
  return now >= notifyAt && now < startDate;
}

/**
 * Computes the countdown until the reveal moment (startDate - 48h).
 *
 * @param startDate - The trip's departure date (UTC)
 * @param now       - The current moment (pass a fixed value for testing)
 * @returns         - `{ revealed: true }` once the window has opened,
 *                   or the remaining days/hours/minutes/seconds otherwise.
 */
export function getRevealCountdown(
  startDate: Date,
  now: Date,
): RevealCountdown {
  const { elapsed, ...rest } = countdownTo(getRevealAt(startDate), now);
  return { revealed: elapsed, ...rest };
}

/**
 * Countdown to departure itself (`startDate`) — a different axis than
 * `getRevealCountdown`, which counts down to the reveal moment (48h before
 * departure). `elapsed: true` once the trip has started. Composes
 * `countdownTo` rather than re-expressing the arithmetic (design.md ADR-5).
 */
export function getDepartureCountdown(startDate: Date, now: Date): Countdown {
  return countdownTo(startDate, now);
}
