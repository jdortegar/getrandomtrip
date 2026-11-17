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
    <section className={styles.guideCompanion} data-component="TripGuideCompanion" id={GUIDE_COMPANION_ID}>
      <span aria-hidden="true" className={`${styles.maskCompass} ${styles.guideCompanionMark}`} />
      <div>
        <p className={styles.guideEyebrow}>{copy.eyebrow}</p>
        <h3 className={`${styles.guideCompanionTitle} ${styles.cond}`}>{copy.title}</h3>
        <p className={styles.guideCompanionBody}>{copy.body}</p>
      </div>
      <Button className={styles.guideCompanionAction} onClick={onSupport} size="lg" type="button" variant="white">
        {copy.action}
      </Button>
    </section>
  );
}
