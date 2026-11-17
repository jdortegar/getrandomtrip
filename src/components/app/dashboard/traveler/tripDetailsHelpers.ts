/**
 * Pure helpers for the traveler trip-details page (design.md ADR-6, ADR-3).
 * Extracted so the 4-step destination fallback and the day-label date math
 * are unit-testable without mounting any component.
 */

import {
  getCalendarDaysUntilDeparture,
  getDepartureCountdown,
} from "@/lib/helpers/getRevealCountdown";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";

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

/**
 * The short place name for the split-flap reveal board: same precedence as
 * {@link resolveTripDestination}, but only the leading place (the city) —
 * "Mendoza, Argentina" → "Mendoza" — so it fits the board's 14 columns.
 */
export function resolveBoardDestination(
  trip: DestinationLikeTrip,
  fallback: string,
): string {
  // Only `actualDestination` is free text in "City, Country" form; the
  // title and fallback copy are shown whole (the board wraps long names).
  return (
    trip.actualDestination?.split(",")[0]?.trim() ||
    trip.experience?.destinationCity?.trim() ||
    trip.experience?.title?.trim() ||
    fallback
  );
}

/**
 * The destination country for the hero eyebrow: the part after the first
 * comma of `actualDestination` ("Mendoza, Argentina" → "Argentina"), else
 * the experience country. Null when neither is known.
 */
export function resolveDestinationCountry(trip: DestinationLikeTrip): string | null {
  if (trip.actualDestination) {
    const rest = trip.actualDestination.split(",").slice(1).join(",").trim();
    if (rest) return rest;
  }
  return trip.experience?.destinationCountry?.trim() || null;
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

/** Short "Fri, Nov 20 → Wed, Nov 25, 2026" range in the trip's UTC dates. */
export function formatTripDateRange(
  startDate: string | null,
  endDate: string | null,
  locale: string,
): string | null {
  if (!startDate) return null;
  const tag = resolveLocaleTag(locale);
  const shortFmt = new Intl.DateTimeFormat(tag, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const start = shortFmt.format(new Date(startDate));
  if (!endDate) return start;
  const end = new Intl.DateTimeFormat(tag, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(endDate));
  return `${start} → ${end}`;
}


interface DepartureLikeTrip {
  startDate: string | null;
  departureTimeZone?: string | null;
}

/** "Departs in N days" / "Departs today" for an upcoming trip; null once departed or undated. */
export function resolveDeparturePill(
  trip: DepartureLikeTrip,
  copy: { departsInDays: string; departsToday: string },
  now: Date = new Date(),
): string | null {
  if (!trip.startDate) return null;
  const startDate = new Date(trip.startDate);
  const countdown = getDepartureCountdown({ startDate, departureTimeZone: trip.departureTimeZone }, now);
  if (countdown.elapsed) return null;
  const calendarDays = getCalendarDaysUntilDeparture(startDate, now);
  return calendarDays > 0 ? interpolateTemplate(copy.departsInDays, { n: String(calendarDays) }) : copy.departsToday;
}

interface PhotoLikeTrip {
  experience?: {
    heroImage: string | null;
    photos?: string[];
    itinerary?: { image: string | null }[] | null;
  } | null;
}

/**
 * Photos for the guide carousel: the experience's destination photos, then
 * itinerary-day images, de-duplicated. The hero photo (already full-screen
 * above) is only used when nothing else exists, then `fallback`.
 */
export function resolveGuidePhotos(trip: PhotoLikeTrip, fallback: string): string[] {
  const experience = trip.experience;
  const dayImages = (Array.isArray(experience?.itinerary) ? experience.itinerary : []).map((day) => day?.image);
  const photos = [...(experience?.photos ?? []), ...dayImages]
    .filter((url): url is string => typeof url === "string" && url.trim() !== "")
    .map((url) => url.trim());
  const unique = [...new Set(photos)];
  if (unique.length) return unique;
  return [experience?.heroImage?.trim() || fallback];
}
