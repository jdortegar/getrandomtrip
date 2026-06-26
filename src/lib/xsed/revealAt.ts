/**
 * Computes the revealAt datetime as 48 hours before the given tripDate.
 *
 * @param tripDate - ISO date/datetime string or undefined
 * @returns Date 48h before tripDate, or null if no tripDate supplied
 */
export function buildRevealAt(tripDate: string | undefined): Date | null {
  if (!tripDate) return null;
  const ms = new Date(tripDate).getTime();
  if (isNaN(ms)) return null;
  return new Date(ms - 48 * 60 * 60 * 1000);
}
