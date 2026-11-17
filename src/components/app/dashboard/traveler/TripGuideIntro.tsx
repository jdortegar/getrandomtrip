"use client";

import { ArrowDown } from "lucide-react";
import Img from "@/components/common/Img";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { GUIDE_ROUTE_ID } from "./tripGuideAnchors";
import styles from "./traveler-trip-details.module.css";

interface TripGuideIntroProps {
  copy: TripItineraryDict["guide"];
  photo: string;
  /** Caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
}

/** Guide opening: eyebrow row, "The world, a little bigger." and a photo. */
export function TripGuideIntro({ copy, photo, place }: TripGuideIntroProps) {
  return (
    <>
      <div className={styles.guideHeadingRow}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <p className={styles.guideNote}>{copy.sampleNote}</p>
      </div>
      <div className={styles.guideIntro} data-component="TripGuideIntro">
        <div>
          <h2 className={`${styles.guideTitle} ${styles.cond}`} id="guide-heading">
            {copy.titleLead}
            {"\n"}
            <span>{copy.titleAccent}</span>
          </h2>
          <p className={styles.guideLead}>{copy.lead}</p>
          <p className={styles.guideBody}>{copy.body}</p>
          <a className={styles.textLink} href={`#${GUIDE_ROUTE_ID}`}>
            {copy.routeLink}
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
        <figure className={styles.guidePhoto}>
          <Img alt="" className="h-full w-full object-cover" src={photo} />
          <figcaption>
            {place} / {copy.photoTagline}
          </figcaption>
        </figure>
      </div>
    </>
  );
}
