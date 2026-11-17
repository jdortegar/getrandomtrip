"use client";

import { ArrowDown } from "lucide-react";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDetailsData } from "@/types/tripDetails";
import { resolveBoardDestination, resolveDestinationCountry } from "./tripDetailsHelpers";
import styles from "./traveler-trip-details.module.css";

/** Same generic photo the dashboard falls back to elsewhere. */
export const FALLBACK_HERO_IMAGE = "/images/hero-image-1.jpeg";
/** Anchor of the trip guide `<main>` rendered below the hero. */
export const TRIP_GUIDE_ID = "trip-guide";

interface TripDestinationHeroProps {
  copy: TripItineraryDict["hero"];
  trip: TripDetailsData;
}

/**
 * Full-viewport destination hero for a revealed trip, styled after the
 * "Randomtrip Reveal — Tablero v2" prototype's final state: the destination
 * photo under a bottom-heavy shade, "YOUR NEXT STORY / COUNTRY" eyebrow, the
 * place set huge, the experience teaser as its one-line description, then a
 * button down to the trip guide and the "first glimpse" caption. Experiences
 * have no hero-image caption yet, so the prototype's landmark line
 * ("CRISTO REDENTOR · PAN DE AZÚCAR") is omitted.
 * Only rendered for fulfillment-visible statuses (REVEALED / COMPLETED /
 * CANCELLED) — the pre-reveal hero is `TripDetailsHero`.
 */
export function TripDestinationHero({ copy, trip }: TripDestinationHeroProps) {
  const place = resolveBoardDestination(trip, copy.destinationFallback);
  const country = resolveDestinationCountry(trip);
  const photo = trip.experience?.heroImage || FALLBACK_HERO_IMAGE;

  const eyebrow =
    trip.status === "CANCELLED"
      ? copy.eyebrowCancelled
      : trip.status === "COMPLETED"
        ? copy.eyebrowCompleted
        : country
          ? `${copy.eyebrowNextStory} / ${country}`
          : copy.eyebrowNextStory;
  const description =
    trip.experience?.teaser?.trim() || interpolateTemplate(copy.subtitle, { nights: String(trip.nights) });

  return (
    <header className={styles.destHero} data-component="TripDestinationHero">
      <Img alt="" aria-hidden="true" className={`${styles.destPhoto} h-full w-full object-cover`} src={photo} />
      <div className={styles.destShade} aria-hidden="true" />

      <div className={styles.destContent}>
        <p className={styles.destEyebrow}>{eyebrow}</p>
        <h1 className={`${styles.destTitle} ${styles.cond}`}>{place}.</h1>
        <p className={styles.destCopy}>{description}</p>

        <div className={styles.destBottom}>
          <Button asChild className={`${styles.btnLight} ${styles.destExplore}`} size="lg" variant="white">
            <a href={`#${TRIP_GUIDE_ID}`}>
              {copy.explore}
              <ArrowDown aria-hidden="true" />
            </a>
          </Button>

          <p className={styles.destCaption}>{copy.firstLook}</p>
        </div>
      </div>
    </header>
  );
}
