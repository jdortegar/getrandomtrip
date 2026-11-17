"use client";

import styles from "./traveler-trip-details.module.css";

interface PlaceholderTagProps {
  label: string;
}

/**
 * Small ochre tag placed next to guide copy that is still static (dictionary)
 * rather than trip data from the database, so placeholder content is visible
 * at a glance until it's wired to real data.
 */
export function PlaceholderTag({ label }: PlaceholderTagProps) {
  return (
    <span className={styles.placeholderTag} data-component="PlaceholderTag">
      {label}
    </span>
  );
}
