"use client";

import { Heart, MapPin, Moon, Users } from "lucide-react";
import type { ReactNode } from "react";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TripEssentialsStripProps {
  copy: TripItineraryDict["essentials"];
  nights: number;
  origin: string;
  pax: number;
  /** `TripRequest.type`: solo/couple/family/group/honeymoon/paws. */
  travelType: string;
}

function resolveTravelTypeLabel(
  travelType: string,
  values: TripItineraryDict["essentials"]["travelTypeValues"],
): string {
  return (values as Record<string, string>)[travelType] ?? travelType;
}

interface EssentialItemProps {
  /** Capitalizes the value visually — for raw/unmapped data (e.g. the
   * travel-type fallback), never for already-composed copy like "5 Nights". */
  capitalize?: boolean;
  icon: ReactNode;
  label: string;
  sub?: string;
  value: string;
}

function EssentialItem({ capitalize, icon, label, sub, value }: EssentialItemProps) {
  return (
    <div className={styles.essentialsItem}>
      <span className={styles.essentialsLabel}>
        {icon}
        {label}
      </span>
      <span
        className={`${styles.essentialsValue} ${styles.cond} ${capitalize ? styles.essentialsValueCapitalize : ""}`}
      >
        {value}
      </span>
      {sub ? <span className={styles.essentialsSub}>{sub}</span> : null}
    </div>
  );
}

/**
 * Essentials strip — four columns, all backed by real `TripRequest` data:
 * Length/Party (revised design.md Resolved Decision #2 superseded — see
 * session follow-up) plus Origin (`originCity`/`originCountry`, always
 * populated) and Travel type (`type`, a fixed 6-value set). District,
 * airport, and room-type remain dropped — no schema backing exists for
 * those.
 */
export function TripEssentialsStrip({
  copy,
  nights,
  origin,
  pax,
  travelType,
}: TripEssentialsStripProps) {
  return (
    <div className={styles.essentials}>
      <EssentialItem
        icon={<Moon aria-hidden="true" />}
        label={copy.lengthLabel}
        sub={interpolateTemplate(copy.daysSub, { n: String(nights + 1) })}
        value={interpolateTemplate(copy.nightsValue, { n: String(nights) })}
      />
      <EssentialItem
        icon={<Users aria-hidden="true" />}
        label={copy.partyLabel}
        value={interpolateTemplate(copy.paxValue, { n: String(pax) })}
      />
      <EssentialItem
        icon={<MapPin aria-hidden="true" />}
        label={copy.originLabel}
        value={origin}
      />
      <EssentialItem
        capitalize
        icon={<Heart aria-hidden="true" />}
        label={copy.travelTypeLabel}
        value={resolveTravelTypeLabel(travelType, copy.travelTypeValues)}
      />
    </div>
  );
}
