"use client";

import { Button } from "@/components/ui/Button";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { GUIDE_COMPANION_ID } from "./tripGuideAnchors";
import styles from "./traveler-trip-details.module.css";

interface TripGuideCompanionProps {
  copy: TripItineraryDict["guide"]["companion"];
  onSupport: () => void;
}

/** Closing support band: "We're with you for what's next." + talk to the team. */
export function TripGuideCompanion({ copy, onSupport }: TripGuideCompanionProps) {
  return (
    <section className={styles.band} data-component="TripGuideCompanion" id={GUIDE_COMPANION_ID}>
      <span aria-hidden="true" className={`${styles.maskCompass} ${styles.bandMark}`} />
      <div>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h3 className={`${styles.bandTitle} ${styles.cond}`}>{copy.title}</h3>
        <p className={styles.bandBody}>{copy.body}</p>
      </div>
      <Button
        className={`${styles.btnLight} ${styles.bandAction}`}
        onClick={onSupport}
        size="lg"
        type="button"
        variant="white"
      >
        {copy.action}
      </Button>
    </section>
  );
}
