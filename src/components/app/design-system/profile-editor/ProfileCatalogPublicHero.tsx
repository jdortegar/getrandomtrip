"use client";

import { useState } from "react";
import { TripperProfileExpertiseStrip } from "@/components/app/tripper-profile/TripperProfileExpertiseStrip";
import { TripperProfileMobileCta } from "@/components/app/tripper-profile/TripperProfileMobileCta";
import { TripperProfileHero } from "@/components/app/tripper-profile/TripperProfileHero";
import { TripperProfileSubnav } from "@/components/app/tripper-profile/TripperProfileSubnav";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";

const PANEL_CLASS = "overflow-hidden bg-ground px-0 pb-0";

export function ProfileCatalogPublicHero({ catalog, copy, locale, publicCopy }: ProfileCatalogExampleProps) {
  const [draft] = useState(() => tripperProfileDraftFixture(locale));
  const minimal = { ...draft.identity, coverCaption: "", portraitUrl: "" };

  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicSubnav}>
        <div className="relative [&_[data-component=TripperProfileSubnav]]:static">
          <TripperProfileSubnav copy={publicCopy.subnav} firstName="Nico" />
        </div>
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicHeroFull}>
        <TripperProfileHero collectionNumber="014" copy={publicCopy.hero} identity={draft.identity} locale={locale} payoff={publicCopy.closing.payoff} />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicHeroMinimal}>
        <TripperProfileHero copy={publicCopy.hero} identity={minimal} locale={locale} payoff={publicCopy.closing.payoff} />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicStrip}>
        <TripperProfileExpertiseStrip
          copy={publicCopy.strip}
          firstName="Nico"
          typeLabels={(["solo", "couple", "group"] as const).map((type) => copy.travelerTypes.types[type].label)}
        />
      </GalleryPanel>
      <GalleryPanel className="bg-ground" title={catalog.panels.publicMobileCta}>
        <div className="mx-auto max-w-[390px] overflow-hidden rounded-xl ring-1 ring-gray-200 [&_[data-component=TripperProfileMobileCta]]:static [&_[data-component=TripperProfileMobileCta]]:flex">
          <TripperProfileMobileCta copy={publicCopy.mobileCta} firstName="Nico" />
        </div>
      </GalleryPanel>
      <UsageExample
        code={`<TripperProfileSubnav copy={copy.subnav} firstName={firstName} />
<TripperProfileHero collectionNumber="014" copy={copy.hero} identity={draft.identity} locale={locale} payoff={copy.closing.payoff} />
<TripperProfileExpertiseStrip copy={copy.strip} firstName={firstName} typeLabels={typeLabels} />`}
        label={catalog.panels.publicHeroFull}
      />
    </div>
  );
}
