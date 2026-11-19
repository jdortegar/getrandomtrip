"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { TripperProfileAtlasMap } from "@/components/app/tripper-profile/TripperProfileAtlasMap";
import { TripperProfileAtlasList } from "@/components/app/tripper-profile/TripperProfileAtlasList";
import { TripperProfileAtlasPanel } from "@/components/app/tripper-profile/TripperProfileAtlasPanel";
import { TripperProfileSegmented } from "@/components/app/tripper-profile/TripperProfileSegmented";
import { TripperProfileSectionHeading } from "@/components/app/tripper-profile/TripperProfileSectionHeading";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { countryLabel } from "@/lib/geo/countryOptions";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { groupPlacesByCountry } from "@/lib/helpers/tripperPublicProfile";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfilePlace } from "@/types/tripper";


interface TripperProfileAtlasProps {
  copy: TripperPublicProfileDict["atlas"];
  firstName: string;
  locale: string;
  places: TripperProfilePlace[];
  storyHrefs: Record<string, string>;
}

type AtlasFilter = "visited" | "expert";
type AtlasView = "map" | "list";

/** "Some places stay with you": been-there / know-it-up-close filter, map or list, with the side panel. */
export function TripperProfileAtlas({ copy, firstName, locale, places, storyHrefs }: TripperProfileAtlasProps) {
  const [filter, setFilter] = useState<AtlasFilter>("visited");
  const [view, setView] = useState<AtlasView>("map");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isInteractive, setIsInteractive] = useState(false);

  const expertCount = places.filter((place) => place.isLocalExpert).length;
  const filtered = useMemo(
    () => (filter === "expert" ? places.filter((place) => place.isLocalExpert) : places),
    [filter, places],
  );
  const countries = groupPlacesByCountry(filtered).length;
  const hasUnlocated = filtered.some((place) => !place.coordinates);

  function handleFilter(next: AtlasFilter) {
    setFilter(next);
    setSelectedCountry(null);
  }

  return (
    <section
      aria-labelledby="tripper-atlas-title"
      className="scroll-mt-32 bg-secondary/25 py-12 md:py-16"
      data-component="TripperProfileAtlas"
      id={TRIPPER_PROFILE_ANCHORS.atlas}
    >
      <div className="rt-container">
        <TripperProfileSectionHeading aside={copy.aside} eyebrow={copy.eyebrow} id="tripper-atlas-title" title={copy.title} />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TripperProfileSegmented<AtlasFilter>
            label={copy.eyebrow}
            onChange={handleFilter}
            options={[
              { count: places.length, label: copy.filters.visited, value: "visited" },
              { count: expertCount, label: copy.filters.expert, value: "expert" },
            ]}
            value={filter}
          />
          <div className="ml-auto">
            <TripperProfileSegmented<AtlasView>
              label={copy.views.map}
              onChange={setView}
              options={[
                { label: copy.views.map, value: "map" },
                { label: copy.views.list, value: "list" },
              ]}
              value={view}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          {filtered.length === 0 ? (
            <p className="p-8 text-sm text-neutral-600">{copy.empty}</p>
          ) : view === "list" ? (
            <TripperProfileAtlasList copy={copy} locale={locale} places={filtered} storyHrefs={storyHrefs} />
          ) : (
            <div className={cn("grid grid-cols-1", "lg:grid-cols-[minmax(0,1fr)_300px]")}>
              <div className="relative flex flex-col bg-secondary/20">
                <div className="flex items-center justify-between gap-3 px-5 pt-3">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-ink">
                    {interpolateTemplate(copy.summary, { countries: String(countries), places: String(filtered.length) })}
                  </p>
                  <ButtonV2
                    aria-pressed={isInteractive}
                    className="min-h-9 gap-2 bg-white px-3 text-[11px]"
                    onClick={() => setIsInteractive((current) => !current)}
                    size="sm"
                    variant="outline"
                  >
                    {isInteractive ? copy.disableMove : copy.enableMove}
                    {isInteractive ? <X aria-hidden /> : <ArrowUpRight aria-hidden />}
                  </ButtonV2>
                </div>
                <div className="relative z-0 h-[264px] lg:h-[435px]">
                  <TripperProfileAtlasMap
                    copy={copy}
                    countryName={(code) => countryLabel(code, locale)}
                    isInteractive={isInteractive}
                    label={interpolateTemplate(copy.mapLabel, { name: firstName })}
                    onSelectCountry={setSelectedCountry}
                    places={filtered}
                    selectedCountry={selectedCountry}
                  />
                </div>
                <p className="px-5 pb-3 text-xs text-ink">
                  {copy.mapHint}
                  {hasUnlocated ? <span className="block">{copy.noPins}</span> : null}
                  <span className="mt-1 block text-[10px] text-neutral-500">{copy.credit}</span>
                </p>
              </div>
              <div className="relative border-t border-gray-200 lg:border-l lg:border-t-0">
                <TripperProfileAtlasPanel
                  copy={copy}
                  locale={locale}
                  onSelectCountry={setSelectedCountry}
                  places={filtered}
                  selectedCountry={selectedCountry}
                  storyHrefs={storyHrefs}
                />
              </div>
            </div>
          )}
        </div>
        <p className="mt-6 text-xs text-neutral-600">{interpolateTemplate(copy.disclaimer, { name: firstName })}</p>
      </div>
    </section>
  );
}
