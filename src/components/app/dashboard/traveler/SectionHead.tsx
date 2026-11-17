"use client";

import styles from "./traveler-trip-details.module.css";

interface SectionHeadProps {
  eyebrow: string;
  /** Rendered with `white-space: pre-line`; `\n` breaks lines. */
  heading: string;
  lede?: string;
  /** Heading level — `h2` for page sections, `h3` inside the guide. */
  as?: "h2" | "h3";
  /** Heading id, for a section's `aria-labelledby`. */
  id?: string;
}

/**
 * The trip page's one section header (prototype "Tablero v2" look): eyebrow
 * and big condensed title on the left, the lede on the right. Shared by the
 * itinerary, documents and guide sections.
 */
export function SectionHead({ eyebrow, heading, lede, as: Heading = "h2", id }: SectionHeadProps) {
  return (
    <div className={styles.sectionHead} data-component="SectionHead">
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <Heading className={`${styles.sectionTitle} ${styles.cond}`} id={id}>
          {heading}
        </Heading>
      </div>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
    </div>
  );
}
