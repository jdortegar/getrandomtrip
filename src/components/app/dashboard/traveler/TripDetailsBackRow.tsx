"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TripDetailsBackRowProps {
  copy: Pick<TripItineraryDict, "backToTrip" | "nav">;
  locale: string;
  tripId: string;
}

/**
 * Back-to-trip row + in-page jump nav (proposal scope #2). The back link is
 * a real `next/link`; the two jump-nav anchors stay plain same-page hash
 * anchors (`#itinerary` / `#documents`), matching the prototype exactly.
 */
export function TripDetailsBackRow({ copy, locale, tripId }: TripDetailsBackRowProps) {
  return (
    <div className={styles.backrow}>
      <Link className={styles.backlink} href={`/${locale}/dashboard/trips/${tripId}`}>
        <ArrowLeft aria-hidden="true" />
        {copy.backToTrip}
      </Link>
      <nav className={styles.jumpnav}>
        <a href="#itinerary">{copy.nav.itinerary}</a>
        <a href="#documents">{copy.nav.documents}</a>
      </nav>
    </div>
  );
}
