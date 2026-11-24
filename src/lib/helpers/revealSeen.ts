/**
 * "Has this browser already watched this trip's destination reveal?" — kept
 * in localStorage so `/dashboard/trips/[id]/destination` plays the reveal
 * gate once, then opens straight on the destination hero. Per browser by
 * design: a new device plays it again, which is harmless. Storage can be
 * missing or throw (private mode, blocked site data); then the gate just
 * plays on every visit.
 */

const KEY_PREFIX = "rt:reveal-seen:";

export function hasSeenReveal(tripId: string): boolean {
  try {
    return window.localStorage.getItem(KEY_PREFIX + tripId) !== null;
  } catch {
    return false;
  }
}

/** Records the reveal as seen — call when the gate finishes (revealed or skipped). */
export function markRevealSeen(tripId: string, now: Date = new Date()): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + tripId, now.toISOString());
  } catch {
    // Storage unavailable: the gate will simply play again next visit.
  }
}
