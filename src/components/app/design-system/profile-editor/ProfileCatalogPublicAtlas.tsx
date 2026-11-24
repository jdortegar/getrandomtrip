"use client";

import { useState } from "react";
import { TripperProfileAtlas } from "@/components/app/tripper-profile/TripperProfileAtlas";
import { TripperProfileAtlasList } from "@/components/app/tripper-profile/TripperProfileAtlasList";
import { TripperProfileSegmented } from "@/components/app/tripper-profile/TripperProfileSegmented";
import {
  tripperProfileDraftFixture,
  tripperProfileStoriesFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";

const PANEL_CLASS = "overflow-hidden bg-ground px-0 pb-0";

export function ProfileCatalogPublicAtlas({ catalog, locale, publicCopy }: ProfileCatalogExampleProps) {
  const [places] = useState(() => tripperProfileDraftFixture(locale).places);
  const [storyHrefs] = useState(() =>
    Object.fromEntries(tripperProfileStoriesFixture(locale).map((story) => [story.id, story.href])),
  );
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicAtlas}>
        <TripperProfileAtlas copy={publicCopy.atlas} firstName="Nico" locale={locale} places={places} storyHrefs={storyHrefs} />
      </GalleryPanel>
      <GalleryPanel className="bg-ground" title={catalog.panels.publicAtlasList}>
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
          <TripperProfileAtlasList copy={publicCopy.atlas} locale={locale} places={places} storyHrefs={storyHrefs} />
        </div>
      </GalleryPanel>
      <GalleryPanel className="bg-secondary/25" title={catalog.panels.publicSegmented}>
        <TripperProfileSegmented
          label={publicCopy.atlas.views.map}
          onChange={setView}
          options={[
            { label: publicCopy.atlas.views.map, value: "map" },
            { label: publicCopy.atlas.views.list, value: "list" },
          ]}
          value={view}
        />
      </GalleryPanel>
      <UsageExample
        code={`<TripperProfileAtlas copy={copy.atlas} firstName={firstName} locale={locale} places={draft.places} storyHrefs={storyHrefs} />`}
        label={catalog.panels.publicAtlas}
      />
    </div>
  );
}
