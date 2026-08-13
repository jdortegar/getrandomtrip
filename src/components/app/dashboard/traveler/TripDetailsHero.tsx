"use client";

import { Calendar, Plane, Users } from "lucide-react";
import Img from "@/components/common/Img";
import { getDepartureCountdown } from "@/lib/helpers/getRevealCountdown";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDetailsData } from "@/types/tripDetails";
import { resolveTripDestination } from "./tripDetailsHelpers";
import styles from "./traveler-trip-details.module.css";

const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  es: "es-AR",
};

function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  locale: string,
): string | null {
  if (!startDate) return null;
  const tag = LOCALE_TAGS[locale] ?? LOCALE_TAGS.es;
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

interface TripDetailsHeroProps {
  copy: TripItineraryDict["hero"];
  locale: string;
  trip: TripDetailsData;
}

/**
 * Reveal hero (design.md ADR-7). Status variants:
 * REVEALED → departure pill shown, eyebrow dot kept,
 * COMPLETED → eyebrow dot kept, never a pill,
 * CANCELLED → no eyebrow dot, never a pill.
 * Background is the assigned experience's real `heroImage`, full-bleed,
 * under a flat dark scrim — falls back to the illustrated gradient
 * (`.hero`'s own `background`) if no experience/photo is assigned yet.
 */
export function TripDetailsHero({ copy, locale, trip }: TripDetailsHeroProps) {
  const isRevealed = trip.status === "REVEALED";
  const isCancelled = trip.status === "CANCELLED";
  const heroImageUrl = trip.experience?.heroImage ?? null;

  const eyebrow = isCancelled
    ? copy.eyebrowCancelled
    : trip.status === "COMPLETED"
      ? copy.eyebrowCompleted
      : copy.eyebrowRevealed;
  const showDot = !isCancelled;

  const destination = resolveTripDestination(trip, copy.destinationFallback);
  const subtitle = interpolateTemplate(copy.subtitle, {
    nights: String(trip.nights),
  });
  const dateRange = formatDateRange(trip.startDate, trip.endDate, locale);

  let pillLabel: string | null = null;
  if (isRevealed && trip.startDate) {
    const countdown = getDepartureCountdown(new Date(trip.startDate), new Date());
    if (!countdown.elapsed) {
      pillLabel =
        countdown.days > 0
          ? interpolateTemplate(copy.departsInDays, { n: String(countdown.days) })
          : copy.departsToday;
    }
  }

  return (
    <header className={styles.hero} role="banner">
      {heroImageUrl ? (
        <Img
          alt=""
          aria-hidden="true"
          className={`${styles.heroImage} h-full w-full object-cover`}
          src={heroImageUrl}
        />
      ) : null}
      <div className={styles.heroScrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>
            {showDot ? <span className={styles.heroEyebrowDot} aria-hidden="true" /> : null}
            {eyebrow}
          </p>
          <h1 className={`${styles.heroTitle} ${styles.cond}`}>{destination}</h1>
          <p className={styles.heroSubtitle}>{subtitle}</p>
          <div className={styles.heroMeta}>
            {dateRange ? (
              <span className={styles.metaItem}>
                <Calendar aria-hidden="true" />
                {dateRange}
              </span>
            ) : null}
            <span className={styles.metaItem}>
              <Users aria-hidden="true" />
              {interpolateTemplate(copy.travelers, { n: String(trip.pax) })}
            </span>
            {pillLabel ? (
              <span className={styles.heroPill}>
                <Plane aria-hidden="true" />
                {pillLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
