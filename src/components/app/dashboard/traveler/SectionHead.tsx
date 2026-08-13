"use client";

import styles from "./traveler-trip-details.module.css";

interface SectionHeadProps {
  eyebrow: string;
  heading: string;
  lede?: string;
}

/**
 * Shared eyebrow/heading/lede block for this page's `#itinerary` and
 * `#documents` sections. Extracted so the heading's `.cond` (Barlow
 * Condensed) composition exists in exactly one place.
 */
export function SectionHead({ eyebrow, heading, lede }: SectionHeadProps) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={`${styles.heading} ${styles.headingSection} ${styles.cond}`}>
          {heading}
        </h2>
        {lede ? <p className={styles.lede}>{lede}</p> : null}
      </div>
    </div>
  );
}
