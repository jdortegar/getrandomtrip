"use client";

import type { ItineraryDayEntry } from "@/types/tripper";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { SectionHead } from "./SectionHead";
import { buildDayDateLabels } from "./tripDetailsHelpers";
import styles from "./traveler-trip-details.module.css";

interface TripItineraryTimelineProps {
  copy: Pick<TripItineraryDict, "itinerary">;
  days: ItineraryDayEntry[];
  locale: string;
  startDate: string | null;
}

/**
 * Day-by-day itinerary timeline (design.md ADR-3). Renders exactly one
 * card per real `ExperienceItineraryDay` entry — no per-stop sub-model is
 * invented (Resolved Decision #1). Day titles/descriptions are
 * tripper-authored content, never dictionary strings (Resolved Decision #5).
 */
export function TripItineraryTimeline({
  copy,
  days,
  locale,
  startDate,
}: TripItineraryTimelineProps) {
  return (
    <section className={styles.block} id="itinerary">
      <SectionHead
        eyebrow={copy.itinerary.eyebrow}
        heading={copy.itinerary.heading}
        lede={copy.itinerary.lede}
      />

      <ol className={styles.timeline}>
        {days.map((day, index) => {
          const { weekday, date } = buildDayDateLabels(startDate, index, locale);
          const padded = String(index + 1).padStart(2, "0");

          return (
            <li className={styles.day} key={index}>
              <div className={styles.dayMarker}>
                <span className={`${styles.dayNum} ${styles.cond}`}>{padded}</span>
                {weekday ? <span className={styles.dayDow}>{weekday}</span> : null}
                {date ? <span className={styles.dayDate}>{date}</span> : null}
              </div>
              <div className={styles.dayBody}>
                <h3 className={`${styles.dayTitle} ${styles.cond}`}>{day.title}</h3>
                {day.description ? <p className={styles.dayDesc}>{day.description}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
