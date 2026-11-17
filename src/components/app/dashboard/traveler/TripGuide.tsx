"use client";

import type { TripItineraryDict } from "@/lib/types/dictionary";
import { TripGuideIntro } from "./TripGuideIntro";
import styles from "./traveler-trip-details.module.css";

interface TripGuideProps {
  copy: TripItineraryDict["guide"];
  photo: string;
  /** Photo caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
  /** Section id, e.g. the hero's "Explore my trip" anchor target. */
  id?: string;
}

/**
 * The "Randomtrip Reveal — Tablero v2" prototype's travel guide, at the end
 * of the revealed trip page: the intro with its photo.
 * Copy is static (dictionary) for now — it will be wired to trip data.
 */
export function TripGuide({ copy, id, photo, place }: TripGuideProps) {
  return (
    <section
      aria-labelledby="guide-heading"
      className={`${styles.wrap} ${styles.guide}`}
      data-component="TripGuide"
      id={id}
    >
      <TripGuideIntro copy={copy} photo={photo} place={place} />
    </section>
  );
}
