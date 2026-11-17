"use client";

import { Button } from "@/components/ui/Button";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TripDetailsHelpStripProps {
  copy: Pick<TripItineraryDict, "support">;
  onOpen: () => void;
}

/**
 * Support-contact band (design.md ADR-4): a traveler → GetRandomtrip support
 * action that opens `TripSupportModal`. Shares the guide's teal `.band`.
 */
export function TripDetailsHelpStrip({ copy, onOpen }: TripDetailsHelpStripProps) {
  return (
    <section className={styles.block} data-component="TripDetailsHelpStrip">
      <div className={styles.band}>
        <span aria-hidden="true" className={`${styles.maskCompass} ${styles.bandMark}`} />
        <div>
          <h3 className={`${styles.bandTitle} ${styles.cond}`}>{copy.support.heading}</h3>
          <p className={styles.bandBody}>{copy.support.body}</p>
        </div>
        <Button
          className={`${styles.btnLight} ${styles.bandAction}`}
          onClick={onOpen}
          size="lg"
          type="button"
          variant="white"
        >
          {copy.support.cta}
        </Button>
      </div>
    </section>
  );
}
