"use client";

import { Plus } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { GUIDE_ESSENTIALS_ID, TRIP_DOCUMENTS_ID } from "./tripGuideAnchors";
import styles from "./traveler-trip-details.module.css";

interface TripGuideEssentialsProps {
  copy: TripItineraryDict["guide"]["essentials"];
  onSupport: () => void;
}

/** "The essentials. No detours." — a native `<details>` accordion. */
export function TripGuideEssentials({ copy, onSupport }: TripGuideEssentialsProps) {
  const items = [
    { key: "packing", question: copy.packing.question, answer: copy.packing.answer, action: null },
    {
      key: "bookings",
      question: copy.bookings.question,
      answer: copy.bookings.answer,
      action: (
        <a className={styles.textLink} href={`#${TRIP_DOCUMENTS_ID}`}>
          {copy.bookings.action}
        </a>
      ),
    },
    {
      key: "help",
      question: copy.help.question,
      answer: copy.help.answer,
      action: (
        <button className={styles.textLink} onClick={onSupport} type="button">
          {copy.help.action}
        </button>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="guide-essentials-heading"
      className={`${styles.block} ${styles.guideEssentials}`}
      data-component="TripGuideEssentials"
      id={GUIDE_ESSENTIALS_ID}
    >
      <div>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h3 className={`${styles.sectionTitle} ${styles.cond}`} id="guide-essentials-heading">
          {copy.title}
        </h3>
        <p className={styles.guideEssentialsBody}>{copy.body}</p>
      </div>
      <div className={styles.guideAccordion}>
        {items.map((item, i) => (
          <details key={item.key}>
            <summary>
              <span className={styles.guideAccordionIndex}>{String(i + 1).padStart(2, "0")}</span>
              {item.question}
              <Plus aria-hidden="true" className={styles.guideAccordionPlus} />
            </summary>
            <div>
              <p>{item.answer}</p>
              {item.action}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
