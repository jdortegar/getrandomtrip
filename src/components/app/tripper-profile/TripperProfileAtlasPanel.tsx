"use client";

import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { countryLabel } from "@/lib/geo/countryOptions";
import { groupPlacesByCountry } from "@/lib/helpers/tripperPublicProfile";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfilePlace } from "@/types/tripper";

interface TripperProfileAtlasPanelProps {
  copy: TripperPublicProfileDict["atlas"];
  locale: string;
  onSelectCountry: (countryCode: string | null) => void;
  places: TripperProfilePlace[];
  selectedCountry: string | null;
  /** Story URL by id, for places linked to a published story. */
  storyHrefs: Record<string, string>;
}

/** Atlas side panel: country chips with counts, reset, and the place list. */
export function TripperProfileAtlasPanel({
  copy,
  locale,
  onSelectCountry,
  places,
  selectedCountry,
  storyHrefs,
}: TripperProfileAtlasPanelProps) {
  const groups = groupPlacesByCountry(places);
  const listed = selectedCountry ? places.filter((place) => place.countryCode === selectedCountry) : places;

  return (
    <div className="flex min-h-0 flex-col gap-4 p-5 lg:absolute lg:inset-0" data-component="TripperProfileAtlasPanel">
      <p className="text-[9px] uppercase tracking-[0.18em] text-ink">{copy.atlasEyebrow}</p>
      <ul className="flex flex-wrap gap-2 lg:grid lg:grid-cols-2">
        {groups.map((group) => {
          const isSelected = selectedCountry === group.countryCode;
          return (
            <li key={group.countryCode}>
              <button
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-2 rounded-full border px-2.5 text-left text-[13px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected ? "border-primary bg-primary text-white" : "border-gray-200 bg-ground text-ink hover:border-primary",
                )}
                onClick={() => onSelectCountry(isSelected ? null : group.countryCode)}
                type="button"
              >
                <span className="truncate" suppressHydrationWarning>
                  {countryLabel(group.countryCode, locale)}
                </span>
                <span className="text-xs tabular-nums">{group.places.length}</span>
              </button>
            </li>
          );
        })}
        <li className="lg:col-span-2">
          <ButtonV2 className="min-h-11 w-full gap-3 rounded-full px-2.5 text-[13px]" onClick={() => onSelectCountry(null)} size="sm">
            {copy.allCountries}
            <RotateCcw aria-hidden />
          </ButtonV2>
        </li>
      </ul>
      <div className="flex items-baseline justify-between border-b border-gray-200 pb-2">
        <h3 className="font-barlow-condensed text-2xl font-bold leading-none text-ink lg:text-[23px]">{copy.listTitle}</h3>
        <span className="text-xs tabular-nums text-neutral-500">{listed.length}</span>
      </div>
      <ul className="-mt-2 max-h-48 min-h-0 divide-y divide-gray-100 overflow-y-auto lg:max-h-none lg:flex-1">
        {listed.map((place) => {
          const href = place.storyId ? storyHrefs[place.storyId] : undefined;
          const meta = `${countryLabel(place.countryCode, locale)} · ${place.isLocalExpert ? copy.localExpert : copy.visited}`;
          const body = (
            <>
              <span className="min-w-0">
                <span className="block text-sm text-ink">{place.city ?? copy.wholeCountry}</span>
                <span className="block text-[11px] text-neutral-500" suppressHydrationWarning>
                  {meta}
                </span>
              </span>
              {href ? <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-primary" /> : null}
            </>
          );
          return (
            <li key={place.id}>
              {href ? (
                <Link
                  aria-label={`${place.city ?? copy.wholeCountry}: ${copy.story}`}
                  className="flex min-h-14 items-center justify-between gap-3 py-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  href={href}
                >
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-14 items-center justify-between gap-3 py-2">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
