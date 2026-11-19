"use client";

import { useState } from "react";
import { TripperProfileClosing } from "@/components/app/tripper-profile/TripperProfileClosing";
import { TripperProfileFaq } from "@/components/app/tripper-profile/TripperProfileFaq";
import { TripperProfileStories } from "@/components/app/tripper-profile/TripperProfileStories";
import {
  tripperProfileEditorialStoriesFixture,
  tripperProfileStoriesFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";

const PANEL_CLASS = "overflow-hidden bg-ground px-0 pb-0";

export function ProfileCatalogPublicStories({ catalog, locale, publicCopy }: ProfileCatalogExampleProps) {
  const [stories] = useState(() => tripperProfileStoriesFixture(locale).slice(0, 3));
  const [editorial] = useState(() => tripperProfileEditorialStoriesFixture(locale));

  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicStoriesTripper}>
        <TripperProfileStories copy={publicCopy.stories} firstName="Nico" name="Nico Aranda" source="tripper" stories={stories} />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicStoriesEditorial}>
        <TripperProfileStories copy={publicCopy.stories} firstName="Nico" name="Nico Aranda" source="editorial" stories={editorial} />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicFaq}>
        <TripperProfileFaq copy={publicCopy.faq} />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicClosing}>
        <TripperProfileClosing copy={publicCopy.closing} firstName="Nico" />
      </GalleryPanel>
      <UsageExample
        code={`const featured = resolveProfileStories(draft.featuredStoryIds, stories, editorialStories);
<TripperProfileStories copy={copy.stories} name={name} source={featured.source} stories={featured.stories} />
<TripperProfileFaq copy={copy.faq} />
<TripperProfileClosing copy={copy.closing} firstName={firstName} />`}
        label={catalog.panels.publicStoriesTripper}
      />
    </div>
  );
}
