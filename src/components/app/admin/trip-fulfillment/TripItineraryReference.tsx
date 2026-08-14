import { Lock } from "lucide-react";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface ItineraryDayEntry {
  title: string;
  description: string;
  image: string | null;
}

export interface ExperienceItinerary {
  title: string;
  itinerary: unknown;
  inclusions: unknown;
  exclusions: unknown;
}

interface TripItineraryReferenceProps {
  copy: MarketingDictionary["adminTripFulfillment"];
  experienceItinerary: ExperienceItinerary | null;
}

/**
 * Section 2 — read-only reference view of the assigned experience's
 * itinerary. Shared per experience/drop, never editable here (design.md
 * "Content model is fixed"). Owns its own panel wrapper, dashed/tinted to
 * read as reference-only without a disabled-looking form control.
 */
export function TripItineraryReference({
  copy,
  experienceItinerary,
}: TripItineraryReferenceProps) {
  const days: ItineraryDayEntry[] = Array.isArray(experienceItinerary?.itinerary)
    ? (experienceItinerary.itinerary as ItineraryDayEntry[])
    : [];
  const inclusions = Array.isArray(experienceItinerary?.inclusions)
    ? (experienceItinerary.inclusions as unknown[]).map(String)
    : [];
  const exclusions = Array.isArray(experienceItinerary?.exclusions)
    ? (experienceItinerary.exclusions as unknown[]).map(String)
    : [];

  const badge = experienceItinerary
    ? interpolateTemplate(copy.itineraryReferenceBadge, {
        experience: experienceItinerary.title,
      })
    : null;

  return (
    <div className={`${styles.panel} ${styles.panelReference}`}>
      <div className={styles.panelBody}>
        <div className={styles.sectionHeadingRow}>
          <div>
            {badge ? (
              <span className={styles.referenceTag}>
                <Lock />
                {badge}
              </span>
            ) : null}
            <p className={styles.panelTitle} style={{ marginTop: 6 }}>
              {copy.itineraryReferenceTitle}
            </p>
            <p className={styles.panelDesc}>{copy.itineraryReferenceBody}</p>
          </div>
          {experienceItinerary ? (
            <button className={`${styles.btn} ${styles.btnGhost}`} type="button">
              {copy.openInEditor}
            </button>
          ) : null}
        </div>

        {days.length === 0 ? (
          <p className={styles.panelDesc} style={{ marginTop: 16 }}>
            {copy.itineraryEmpty}
          </p>
        ) : (
          <div className={styles.dayList}>
            {days.map((day, i) => (
              <div className={styles.dayRow} key={i}>
                <span className={`${styles.dayBadge} ${styles.cond}`}>Day {i + 1}</span>
                <div className={styles.dayContent}>
                  <span className={styles.dayTitle}>{day.title}</span>
                  {day.description ? (
                    // `day.description` is tripper-authored HTML from
                    // RichTextInput/TinyMCE — same field the traveler-facing
                    // TripItineraryTimeline renders, same trust boundary.
                    <div
                      className={styles.dayDesc}
                      dangerouslySetInnerHTML={{ __html: day.description }}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {inclusions.length > 0 || exclusions.length > 0 ? (
          <div className={styles.grid2} style={{ marginTop: 16 }}>
            {inclusions.length > 0 && (
              <ul className={styles.factList}>
                {inclusions.map((item, i) => (
                  <li className={styles.factRow} key={i}>
                    ✓ {item}
                  </li>
                ))}
              </ul>
            )}
            {exclusions.length > 0 && (
              <ul className={styles.factList}>
                {exclusions.map((item, i) => (
                  <li className={styles.factRow} key={i}>
                    ✗ {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
