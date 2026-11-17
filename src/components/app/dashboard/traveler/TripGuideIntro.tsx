"use client";

import { ArrowDown } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { PlaceholderTag } from "./PlaceholderTag";
import { TripGuidePhotos } from "./TripGuidePhotos";
import styles from "./traveler-trip-details.module.css";

/** `TripItineraryTimeline`'s section id (also on its empty states). */
export const ITINERARY_ID = "itinerary";

interface TripGuideIntroProps {
  copy: TripItineraryDict["guide"];
  /** Carousel photos; see `resolveGuidePhotos`. */
  photos: string[];
  /** Caption prefix, e.g. "JUNÍN, ARGENTINA". */
  place: string;
  /** `experience.title`; falls back to the static guide title. */
  title?: string | null;
  /** `experience.description`; falls back to the static guide body. */
  body?: string | null;
  /** First stay's name, e.g. "Estancia La Oriental"; falls back to the static tagline. */
  stay?: string | null;
}

/**
 * Guide opening: title, lead, body, a link down to the itinerary and a photo
 * carousel.
 * Title, body and the caption's second half come from the trip's experience
 * when present; a slot falling back to static copy carries a `PlaceholderTag`.
 * The lead is fixed brand copy (the hero already shows the teaser), untagged.
 */
export function TripGuideIntro({ copy, photos, place, title, body, stay }: TripGuideIntroProps) {
  const tag = <PlaceholderTag label={copy.placeholderTag} />;
  const dataTitle = title?.trim();
  const dataBody = body?.trim();
  const dataStay = stay?.trim();

  return (
    <div className={styles.guideIntro} data-component="TripGuideIntro">
      <div>
        {dataTitle ? (
          <h2 className={`${styles.guideTitle} ${styles.guideTitleData} ${styles.cond}`} id="guide-heading">
            {dataTitle}
          </h2>
        ) : (
          <>
            <h2 className={`${styles.guideTitle} ${styles.cond}`} id="guide-heading">
              {copy.titleLead}
              {"\n"}
              <span>{copy.titleAccent}</span>
            </h2>
            <p className={styles.guideTagRow}>{tag}</p>
          </>
        )}
        <p className={styles.guideLead}>{copy.lead}</p>
        <p className={styles.guideBody}>{dataBody ? dataBody : <>{copy.body} {tag}</>}</p>
        <a className={styles.textLink} href={`#${ITINERARY_ID}`}>
          {copy.routeLink}
          <ArrowDown aria-hidden="true" />
        </a>
      </div>
      <TripGuidePhotos
        caption={
          <>
            {place} / {dataStay ? dataStay : <>{copy.photoTagline} {tag}</>}
          </>
        }
        copy={copy}
        photos={photos}
      />
    </div>
  );
}
