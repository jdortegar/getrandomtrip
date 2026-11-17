"use client";

import { RotateCcw } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TriggerRevealAnimationProps {
  copy: TripItineraryDict["revealReplay"];
  onReplay: () => void;
}

/**
 * Full-width bar under the revealed destination hero (the prototype's
 * `.arrival-line`): a brand line on the left and "Relive the reveal" on the
 * right, which sends the traveler back to the reveal's ready screen.
 */
export function TriggerRevealAnimation({ copy, onReplay }: TriggerRevealAnimationProps) {
  return (
    <div className={styles.replayBar} data-component="TriggerRevealAnimation">
      <p className={styles.replayLine}>
        <span className={styles.replayDot} aria-hidden="true" />
        {copy.line}
      </p>
      <button className={styles.replayButton} onClick={onReplay} type="button">
        {copy.action}
        <RotateCcw aria-hidden="true" />
      </button>
    </div>
  );
}
