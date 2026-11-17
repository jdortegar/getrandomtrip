"use client";

import type { TripItineraryDict } from "@/lib/types/dictionary";
import { TripGuideIntro } from "./TripGuideIntro";
import styles from "./traveler-trip-details.module.css";

interface TripGuideProps {
  copy: TripItineraryDict["guide"];
  photo: string;
  /** Photo caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
}

/**
 * The "Randomtrip Reveal — Tablero v2" prototype's travel guide intro with
 * its photo. Rendered inside the trip `<main>` (which provides the page
 * frame), between the trip-details strip and the itinerary. Copy is static
 * (dictionary) for now — it will be wired to trip data.
 */
export function TripGuide({ copy, photo, place }: TripGuideProps) {
  return (
    <section aria-labelledby="guide-heading" className={styles.guide} data-component="TripGuide">
      <TripGuideIntro copy={copy} photo={photo} place={place} />
    </section>
  );
}
