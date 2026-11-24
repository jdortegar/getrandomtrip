"use client";

import { useState } from "react";
import { AtlasPlaceList } from "@/components/app/dashboard/tripper/profile-editor/steps/AtlasPlaceList";
import { AtlasStep } from "@/components/app/dashboard/tripper/profile-editor/steps/AtlasStep";
import {
  tripperProfileDraftFixture,
  tripperProfileStoriesFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { cn } from "@/lib/utils";
import type { TripperProfilePlace } from "@/types/tripper";

export function ProfileCatalogAtlas({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [places, setPlaces] = useState(() => tripperProfileDraftFixture(locale).places);
  const [stories] = useState(() => tripperProfileStoriesFixture(locale));
  const listPreview = places.slice(0, 2);

  function handleChange(id: string, patch: Partial<TripperProfilePlace>) {
    setPlaces((current) => current.map((place) => (place.id === id ? { ...place, ...patch } : place)));
  }

  function handleRemove(id: string) {
    setPlaces((current) => current.filter((place) => place.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel className="bg-ground" title={catalog.panels.stepAtlas}>
        <div className="max-w-3xl">
          <AtlasStep
            commonCopy={copy.common}
            copy={copy.atlas}
            locale={locale}
            onChange={setPlaces}
            places={places}
            stories={stories}
          />
        </div>
      </GalleryPanel>
      <div className={cn("grid grid-cols-1 gap-6", "lg:grid-cols-2")}>
        <GalleryPanel className="min-w-0" title={catalog.panels.placeListStories}>
          <AtlasPlaceList
            commonCopy={copy.common}
            copy={copy.atlas}
            locale={locale}
            onChange={handleChange}
            onRemove={handleRemove}
            places={listPreview}
            stories={stories}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.placeListPending}>
          <AtlasPlaceList
            commonCopy={copy.common}
            copy={copy.atlas}
            locale={locale}
            onChange={handleChange}
            onRemove={handleRemove}
            places={listPreview}
            stories={[]}
          />
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<AtlasStep commonCopy={copy.common} copy={copy.atlas} locale={locale} onChange={setPlaces} places={draft.places} stories={stories} />
<AtlasPlaceList commonCopy={copy.common} copy={copy.atlas} locale={locale} onChange={patchPlace} onRemove={removePlace} places={places} stories={[]} />`}
        label={catalog.panels.stepAtlas}
      />
    </div>
  );
}
