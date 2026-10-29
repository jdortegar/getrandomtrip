const FALLBACK_TIME_ZONE = "America/Argentina/Buenos_Aires";

/**
 * The pay-by time in the trip's departure time zone, 24h clock (a "9:00 a. m."
 * ending would double the sentence's period). An unknown zone falls back to
 * Buenos Aires, like trips without one, instead of throwing.
 */
export function formatPaymentDeadline(
  deadline: Date,
  locale: "es" | "en",
  timeZone?: string | null,
): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  const tag = locale === "en" ? "en-US" : "es-AR";
  try {
    return new Intl.DateTimeFormat(tag, { ...options, timeZone: timeZone ?? FALLBACK_TIME_ZONE }).format(deadline);
  } catch {
    return new Intl.DateTimeFormat(tag, { ...options, timeZone: FALLBACK_TIME_ZONE }).format(deadline);
  }
}
