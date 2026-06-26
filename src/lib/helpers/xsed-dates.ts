/**
 * Returns the Saturday that follows the next Sunday booking window.
 * Booking opens Sunday 16:00–20:00 local time; the trip always departs
 * the Saturday immediately after that Sunday (6 days later).
 * Using nearest-Saturday logic was wrong: on a Friday it returned tomorrow,
 * creating trips that started the next day instead of 8 days out.
 */
export function getNextWeekend(): { saturday: Date; sunday: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay(); // 0=Sun … 6=Sat
  const daysUntilNextSunday = day === 0 ? 0 : 7 - day;
  const daysUntilSat = daysUntilNextSunday + 6;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSat);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { saturday, sunday };
}

/** ISO date string (YYYY-MM-DD) from a Date. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
