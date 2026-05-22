/** Returns the next upcoming Saturday (day 6). If today is Saturday, jumps one full week. */
export function getNextWeekend(): { saturday: Date; sunday: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const daysUntilSat = day === 6 ? 7 : 6 - day;
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
