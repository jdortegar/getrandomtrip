"use client";

import { useState } from "react";
import { TripperProfileGalleryCarousel } from "@/components/app/tripper-profile/TripperProfileGalleryCarousel";
import { TripperProfileMediaCard } from "@/components/app/tripper-profile/TripperProfileMediaCard";
import { TripperProfileMediaCarousel } from "@/components/app/tripper-profile/TripperProfileMediaCarousel";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { cn } from "@/lib/utils";
import type { TripperProfileMediaItem } from "@/types/tripper";

const PANEL_CLASS = "overflow-hidden bg-ground px-0 pb-0";

export function ProfileCatalogPublicMedia({ catalog, locale, publicCopy }: ProfileCatalogExampleProps) {
  const [draft] = useState(() => tripperProfileDraftFixture(locale));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [youtube, instagram] = draft.media.items;
  const cards: { item: TripperProfileMediaItem; panel: keyof typeof catalog.panels }[] = [
    { item: youtube!, panel: "publicMediaPoster" },
    { item: { ...instagram!, id: "catalog-profile", url: "https://www.instagram.com/getrandomtrip.es/" }, panel: "publicMediaProfileLink" },
    { item: { ...youtube!, id: "catalog-upload", provider: "upload", url: "" }, panel: "publicMediaUpload" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid grid-cols-1 gap-6", "md:grid-cols-3")}>
        {cards.map(({ item, panel }) => (
          <GalleryPanel className="min-w-0 bg-ground" key={item.id} title={catalog.panels[panel]}>
            <TripperProfileMediaCard
              copy={publicCopy.media}
              index={1}
              isActive={activeId === item.id}
              item={item}
              onActivate={() => setActiveId(item.id)}
              onStop={() => setActiveId(null)}
            />
          </GalleryPanel>
        ))}
      </div>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicMediaCarousel}>
        <TripperProfileMediaCarousel carouselCopy={publicCopy.carousel} copy={publicCopy.media} items={draft.media.items} />
      </GalleryPanel>
      <GalleryPanel className={PANEL_CLASS} title={catalog.panels.publicGallery}>
        <TripperProfileGalleryCarousel carouselCopy={publicCopy.carousel} copy={publicCopy.gallery} items={draft.media.gallery} name="Nico" />
      </GalleryPanel>
      <UsageExample
        code={`<TripperProfileMediaCarousel carouselCopy={copy.carousel} copy={copy.media} items={draft.media.items} />
<TripperProfileGalleryCarousel carouselCopy={copy.carousel} copy={copy.gallery} items={draft.media.gallery} name={firstName} />`}
        label={catalog.panels.publicMediaCarousel}
      />
    </div>
  );
}
