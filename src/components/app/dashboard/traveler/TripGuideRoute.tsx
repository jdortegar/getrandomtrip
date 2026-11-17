"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { GUIDE_ROUTE_ID } from "./tripGuideAnchors";
import styles from "./traveler-trip-details.module.css";

interface TripGuideRouteProps {
  copy: TripItineraryDict["guide"]["route"];
}

const NAV_KEYS = ["ArrowRight", "ArrowLeft", "Home", "End"];

/**
 * "Less planning. More being there." — the route moments as tabs (click, or
 * arrow keys / Home / End with roving tabindex), one panel at a time.
 */
export function TripGuideRoute({ copy }: TripGuideRouteProps) {
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const moments = copy.moments;
  const moment = moments[selected];
  const number = (i: number) => String(i + 1).padStart(2, "0");

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();
    const last = moments.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : (index + (event.key === "ArrowRight" ? 1 : -1) + moments.length) % moments.length;
    setSelected(next);
    tabsRef.current[next]?.focus();
  }

  if (!moment) return null;

  return (
    <section
      aria-labelledby="guide-route-heading"
      className={styles.guideSection}
      data-component="TripGuideRoute"
      id={GUIDE_ROUTE_ID}
    >
      <div className={styles.guideSectionTop}>
        <div>
          <p className={styles.guideEyebrow}>{copy.eyebrow}</p>
          <h3 className={`${styles.guideSectionTitle} ${styles.cond}`} id="guide-route-heading">
            {copy.title}
          </h3>
        </div>
        <p>{copy.note}</p>
      </div>

      <div aria-label={copy.tabsLabel} className={styles.guideTabs} role="tablist">
        {moments.map((m, i) => (
          <button
            aria-controls="guide-route-panel"
            aria-selected={i === selected}
            className={`${styles.guideTab} ${styles.cond}`}
            id={`guide-route-tab-${i}`}
            key={m.tab}
            onClick={() => setSelected(i)}
            onKeyDown={(event) => onKeyDown(event, i)}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            role="tab"
            tabIndex={i === selected ? 0 : -1}
            type="button"
          >
            {number(i)} <span>{m.tab}</span>
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`guide-route-tab-${selected}`}
        className={styles.guidePanel}
        id="guide-route-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <span aria-hidden="true" className={`${styles.guidePanelNumber} ${styles.cond}`}>
          {number(selected)}
        </span>
        <div>
          <p className={styles.guideEyebrow}>{moment.tab}</p>
          <h4 className={styles.cond}>{moment.title}</h4>
          <p className={styles.guidePanelCopy}>{moment.copy}</p>
        </div>
        <p className={styles.guidePanelAside}>{moment.aside}</p>
      </div>
    </section>
  );
}
