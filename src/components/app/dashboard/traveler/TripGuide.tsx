"use client";

import type { TripItineraryDict } from "@/lib/types/dictionary";
import { TripGuideIntro } from "./TripGuideIntro";
import styles from "./traveler-trip-details.module.css";

interface TripGuideProps {
  copy: TripItineraryDict["guide"];
  /** Carousel photos; see `resolveGuidePhotos`. */
  photos: string[];
  /** Photo caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
  /** Trip data for the intro; each falls back to static copy (see `TripGuideIntro`). */
  title?: string | null;
  body?: string | null;
  stay?: string | null;
}

/**
 * The "Randomtrip Reveal — Tablero v2" prototype's travel guide intro with
 * its photo carousel. Rendered inside the trip `<main>` (which provides the page
 * frame), between the trip-details strip and the itinerary. Title, body and
 * stay come from the trip's experience; static copy fills any empty slot.
 */
export function TripGuide({ copy, photos, place, title, body, stay }: TripGuideProps) {
  return (
    <section aria-labelledby="guide-heading" className={styles.guide} data-component="TripGuide">
      <TripGuideIntro body={body} copy={copy} photos={photos} place={place} stay={stay} title={title} />
    </section>
  );
}
