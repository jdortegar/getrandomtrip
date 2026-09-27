const DAY_MS = 86400000;

/** Travel dates are UTC calendar days, not browser-local timestamps. */
export function parseTripCalendarDate(value: unknown): Date | null {
  const text =
    value instanceof Date && Number.isFinite(value.getTime())
      ? value.toISOString()
      : value;
  if (
    typeof text !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/.test(text)
  )
    return null;
  const day = text.slice(0, 10);
  const date = new Date(`${day}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === day
    ? date
    : null;
}

export function earliestTripStartDate(
  type = "journey",
  now = new Date(),
): Date {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return new Date(today + (type === "xsed" ? 0 : 7) * DAY_MS);
}

export function isTripStartDateEligible(
  value: unknown,
  type = "journey",
  now = new Date(),
): boolean {
  const date = parseTripCalendarDate(value);
  return !!date && date >= earliestTripStartDate(type, now);
}

export function validateTripDates(trip: {
  startDate?: unknown;
  endDate?: unknown;
  status?: unknown;
  type?: unknown;
}): string | null {
  const start = parseTripCalendarDate(trip.startDate);
  const end = parseTripCalendarDate(trip.endDate);
  if (trip.startDate != null && trip.startDate !== "" && !start)
    return "Invalid departure date";
  if (trip.endDate != null && trip.endDate !== "" && !end)
    return "Invalid return date";
  if (["SAVED", "PENDING_PAYMENT"].includes(String(trip.status)) && !start)
    return "Departure date is required";
  if (
    start &&
    ["DRAFT", "SAVED", "PENDING_PAYMENT"].includes(String(trip.status)) &&
    !isTripStartDateEligible(start, String(trip.type))
  ) {
    return trip.type === "xsed"
      ? "Departure date is in the past"
      : "Departure must be at least 7 calendar days from today";
  }
  if (start && end && end <= start)
    return "Return date must be after departure";
  return null;
}
