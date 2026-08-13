"use client";

import { MessageCircle } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TripDetailsHelpStripProps {
  copy: Pick<TripItineraryDict, "support">;
  onOpen: () => void;
}

/**
 * Dark support-contact CTA strip (design.md ADR-4). Repurposed from the
 * prototype's "Message your Tripper" into a traveler → GetRandomTrip
 * support action (Resolved Decision #4) — the button opens `TripSupportModal`.
 */
export function TripDetailsHelpStrip({ copy, onOpen }: TripDetailsHelpStripProps) {
  return (
    <section className={styles.block}>
      <div className={styles.help}>
        <div className={styles.helpText}>
          <h3 className={styles.cond}>{copy.support.heading}</h3>
          <p>{copy.support.body}</p>
        </div>
        <button className={styles.btn} onClick={onOpen} type="button">
          <MessageCircle aria-hidden="true" />
          {copy.support.cta}
        </button>
      </div>
    </section>
  );
}
