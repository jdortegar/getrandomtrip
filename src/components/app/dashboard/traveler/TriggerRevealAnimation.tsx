"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TriggerRevealAnimationProps {
  copy: TripItineraryDict["revealReplay"];
  /** Locale-aware path to the full trip-details page. */
  detailsHref: string;
  onReplay: () => void;
}

/**
 * Full-width bar under the revealed destination hero (the prototype's
 * `.arrival-line`): a brand line on the left and "Relive the reveal" on the
 * right, which sends the traveler back to the reveal's ready screen, next to
 * a link to the full trip-details page.
 */
export function TriggerRevealAnimation({ copy, detailsHref, onReplay }: TriggerRevealAnimationProps) {
  return (
    <div className={styles.replayBar} data-component="TriggerRevealAnimation">
      <p className={styles.replayLine}>
        <span className={styles.replayDot} aria-hidden="true" />
        {copy.line}
      </p>
      <div className={styles.replayActions}>
        <button className={styles.replayButton} onClick={onReplay} type="button">
          {copy.action}
          <RotateCcw aria-hidden="true" />
        </button>
        <Link className={styles.replayButton} href={detailsHref}>
          {copy.details}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
