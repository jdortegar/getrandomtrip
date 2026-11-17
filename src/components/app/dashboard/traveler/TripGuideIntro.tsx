"use client";

import { ArrowDown } from "lucide-react";
import Img from "@/components/common/Img";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { PlaceholderTag } from "./PlaceholderTag";
import styles from "./traveler-trip-details.module.css";

/** Anchor of the trip-details strip (nights, group, origin, type) below the guide. */
export const TRIP_DETAILS_ID = "trip-details";

interface TripGuideIntroProps {
  copy: TripItineraryDict["guide"];
  photo: string;
  /** Caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
}

/**
 * Guide opening: "The world, a little bigger." and a photo.
 * The photo and place come from the trip; every static line carries a
 * `PlaceholderTag` until it's backed by database content.
 */
export function TripGuideIntro({ copy, photo, place }: TripGuideIntroProps) {
  const tag = <PlaceholderTag label={copy.placeholderTag} />;

  return (
    <>
      <div className={styles.guideIntro} data-component="TripGuideIntro">
        <div>
          <h2 className={`${styles.guideTitle} ${styles.cond}`} id="guide-heading">
            {copy.titleLead}
            {"\n"}
            <span>{copy.titleAccent}</span>
          </h2>
          <p className={styles.guideTagRow}>{tag}</p>
          <p className={styles.guideLead}>
            {copy.lead} {tag}
          </p>
          <p className={styles.guideBody}>
            {copy.body} {tag}
          </p>
          <a className={styles.textLink} href={`#${TRIP_DETAILS_ID}`}>
            {copy.routeLink}
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
        <figure className={styles.guidePhoto}>
          <Img alt="" className="h-full w-full object-cover" src={photo} />
          <figcaption>
            {place} / {copy.photoTagline} {tag}
          </figcaption>
        </figure>
      </div>
    </>
  );
}
