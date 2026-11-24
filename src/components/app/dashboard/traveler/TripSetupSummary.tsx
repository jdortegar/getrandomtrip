"use client";

import { PanelCard } from "@/components/common/PanelCard";
import type { ResolvedExcuseSelection } from "@/lib/helpers/excuse-helper";
import type { TripDetailDict } from "@/lib/types/dictionary";
import type { TripSetupItem } from "@/types/tripDetails";

interface TripSetupSummaryProps {
  avoidDestinations: string[];
  copy: Pick<
    TripDetailDict,
    | "avoidDestinationsLabel"
    | "excuseLabel"
    | "filtersTitle"
    | "refineDetailsLabel"
    | "setupEyebrow"
    | "setupTitle"
  >;
  excuse: ResolvedExcuseSelection | null;
  /** Already-localized filter rows (transport, climate, …). */
  filters: TripSetupItem[];
  /** Type and experience level rows. */
  items: TripSetupItem[];
}

function SetupGrid({ rows }: { rows: TripSetupItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {row.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium text-ink">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Everything the traveler chose when building the trip — type, experience
 * level, excuse, filters and destinations to avoid — in one card. Dates,
 * origin, nights and travelers live in `TripDetailsHeader`, not here.
 */
export function TripSetupSummary({
  avoidDestinations,
  copy,
  excuse,
  filters,
  items,
}: TripSetupSummaryProps) {
  const basics = [...items];
  if (excuse) {
    basics.push({ label: copy.excuseLabel, value: excuse.title });
    if (excuse.refineDetails.length > 0) {
      basics.push({
        label: copy.refineDetailsLabel,
        value: excuse.refineDetails.map((detail) => detail.label).join(", "),
      });
    }
  }
  const preferences =
    avoidDestinations.length > 0
      ? [
          ...filters,
          {
            label: copy.avoidDestinationsLabel,
            value: avoidDestinations.join(", "),
          },
        ]
      : filters;

  return (
    <PanelCard>
      <div data-component="TripSetupSummary">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.setupEyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-bold uppercase leading-none text-ink">
          {copy.setupTitle}
        </h2>

        <div className="mt-6">
          <SetupGrid rows={basics} />
        </div>

        {preferences.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="mb-4 text-sm font-semibold text-ink">
              {copy.filtersTitle}
            </h3>
            <SetupGrid rows={preferences} />
          </div>
        )}
      </div>
    </PanelCard>
  );
}
