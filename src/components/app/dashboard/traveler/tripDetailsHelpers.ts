/**
 * Pure helpers for the traveler trip-details page (design.md ADR-6, ADR-3).
 * Extracted so the 4-step destination fallback and the day-label date math
 * are unit-testable without mounting any component.
 */

interface DestinationLikeTrip {
  actualDestination: string | null;
  experience?: {
    destinationCity: string | null;
    destinationCountry: string | null;
    title: string;
  } | null;
}

/**
 * Resolves the hero's destination string, in order:
 * `actualDestination` → `[city, country].filter(Boolean).join(", ")` →
 * `experience.title` → the caller-provided fallback copy.
 */
export function resolveTripDestination(
  trip: DestinationLikeTrip,
  fallback: string,
): string {
  if (trip.actualDestination) return trip.actualDestination;

  const cityCountry = [
    trip.experience?.destinationCity,
    trip.experience?.destinationCountry,
  ]
    .filter(Boolean)
    .join(", ");
  if (cityCountry) return cityCountry;

  if (trip.experience?.title) return trip.experience.title;

  return fallback;
}

interface OriginLikeTrip {
  originCity: string;
  originCountry: string;
}

/** `originCity`/`originCountry` are both non-nullable on `TripRequest`, so
 * unlike `resolveTripDestination` this never needs a fallback chain. */
export function resolveTripOrigin(trip: OriginLikeTrip): string {
  return `${trip.originCity}, ${trip.originCountry}`;
}

const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  es: "es-AR",
};

function resolveLocaleTag(locale: string): string {
  return LOCALE_TAGS[locale] ?? LOCALE_TAGS.es;
}

export interface DayDateLabels {
  weekday: string | null;
  date: string | null;
}

/**
 * Derives the weekday/short-date label for itinerary day `index`, offset
 * from `startDate` by `index` days. Returns nulls when `startDate` is
 * absent — the day marker then renders the day number only (design.md
 * ADR-3). Dates are formatted with `Intl.DateTimeFormat`, never hardcoded
 * month names.
 */
export function buildDayDateLabels(
  startDate: string | null,
  index: number,
  locale: string,
): DayDateLabels {
  if (!startDate) return { weekday: null, date: null };

  const base = new Date(startDate);
  if (Number.isNaN(base.getTime())) return { weekday: null, date: null };

  const day = new Date(base.getTime() + index * 24 * 60 * 60 * 1000);
  const tag = resolveLocaleTag(locale);

  const weekday = new Intl.DateTimeFormat(tag, {
    timeZone: "UTC",
    weekday: "long",
  }).format(day);
  const date = new Intl.DateTimeFormat(tag, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(day);

  return { weekday, date };
}
