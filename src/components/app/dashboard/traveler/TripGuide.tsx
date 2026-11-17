"use client";

import type { TripItineraryDict } from "@/lib/types/dictionary";
import { TripGuideCompanion } from "./TripGuideCompanion";
import { TripGuideEssentials } from "./TripGuideEssentials";
import { TripGuideIntro } from "./TripGuideIntro";
import { TripGuideRoute } from "./TripGuideRoute";
import { GUIDE_COMPANION_ID, GUIDE_ESSENTIALS_ID, GUIDE_ROUTE_ID } from "./tripGuideAnchors";
import styles from "./traveler-trip-details.module.css";

interface TripGuideProps {
  copy: TripItineraryDict["guide"];
  photo: string;
  /** Photo caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
  onSupport: () => void;
}

/**
 * The "Randomtrip Reveal — Tablero v2" prototype's travel guide, at the end
 * of the revealed trip page. Copy is static (dictionary) for now — it will be
 * wired to trip data block by block.
 */
export function TripGuide({ copy, photo, place, onSupport }: TripGuideProps) {
  return (
    <section aria-labelledby="guide-heading" className={`${styles.wrap} ${styles.guide}`} data-component="TripGuide">
      <TripGuideIntro copy={copy} photo={photo} place={place} />

      <nav aria-label={copy.nav.label} className={styles.guideNav}>
        <a href={`#${GUIDE_ROUTE_ID}`}>01 &nbsp; {copy.nav.route}</a>
        <a href={`#${GUIDE_ESSENTIALS_ID}`}>02 &nbsp; {copy.nav.essentials}</a>
        <a href={`#${GUIDE_COMPANION_ID}`}>03 &nbsp; {copy.nav.companion}</a>
      </nav>

      <TripGuideRoute copy={copy.route} />
      <TripGuideEssentials copy={copy.essentials} onSupport={onSupport} />
      <TripGuideCompanion copy={copy.companion} onSupport={onSupport} />
    </section>
  );
}
