"use client";

import { useState } from "react";
import { TripperProfileAbout } from "@/components/app/tripper-profile/TripperProfileAbout";
import { TripperProfileJourneyCards } from "@/components/app/tripper-profile/TripperProfileJourneyCards";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";

const PANEL_CLASS = "overflow-hidden bg-ground px-0 pb-0";
const HREFS = { couple: "#", group: "#", solo: "#" };

export function ProfileCatalogPublicJourneys({ catalog, copy, locale, publicCopy }: ProfileCatalogExampleProps) {
  const [draft] = useState(() => tripperProfileDraftFixture(locale));

  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicJourneysAll}>
        <TripperProfileJourneyCards
          copy={publicCopy.journeys}
          hrefs={HREFS}
          travelerTypes={draft.travelerTypes}
          typeCopy={copy.travelerTypes.types}
          types={["solo", "couple", "group"]}
        />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicJourneysTwo}>
        <TripperProfileJourneyCards
          copy={publicCopy.journeys}
          hrefs={HREFS}
          travelerTypes={draft.travelerTypes}
          typeCopy={copy.travelerTypes.types}
          types={["solo", "couple"]}
        />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicAbout}>
        <TripperProfileAbout
          affinityLabels={copy.perspective.affinityOptions}
          bio={draft.bio}
          collectionNumber="014"
          copy={publicCopy.about}
          name={draft.identity.name}
          portraitUrl={draft.identity.portraitUrl}
        />
      </GalleryPanel>
      <UsageExample
        code={`<TripperProfileJourneyCards copy={copy.journeys} hrefs={journeyHrefs} travelerTypes={draft.travelerTypes} typeCopy={editorCopy.travelerTypes.types} types={enabledTypes} />
<TripperProfileAbout affinityLabels={editorCopy.perspective.affinityOptions} bio={draft.bio} collectionNumber="014" copy={copy.about} name={name} portraitUrl={portraitUrl} />`}
        label={catalog.panels.publicJourneysAll}
      />
    </div>
  );
}
