"use client";

import { useCallback, useState } from "react";
import { TripperProfileCarousel } from "@/components/app/tripper-profile/TripperProfileCarousel";
import { TripperProfileMediaCard } from "@/components/app/tripper-profile/TripperProfileMediaCard";
import { TripperProfileSectionHeading } from "@/components/app/tripper-profile/TripperProfileSectionHeading";
import { getVisibleMediaItems } from "@/lib/helpers/tripperPublicProfile";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileMediaItem } from "@/types/tripper";

interface TripperProfileMediaCarouselProps {
  carouselCopy: TripperPublicProfileDict["carousel"];
  copy: TripperPublicProfileDict["media"];
  items: TripperProfileMediaItem[];
}

/** "My world has more than one window": visible videos/posts; one player at a time. */
export function TripperProfileMediaCarousel({ carouselCopy, copy, items }: TripperProfileMediaCarouselProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const stop = useCallback(() => setActiveId(null), []);
  const visible = getVisibleMediaItems(items);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="tripper-media-title" className="rt-container py-12 md:py-16" data-component="TripperProfileMediaCarousel">
      <TripperProfileSectionHeading aside={copy.aside} eyebrow={copy.eyebrow} id="tripper-media-title" title={copy.title} />
      <TripperProfileCarousel ariaLabel={copy.title} copy={carouselCopy} onSlideChange={stop}>
        {visible.map((item, index) => (
          <TripperProfileMediaCard
            copy={copy}
            index={index + 1}
            isActive={activeId === item.id}
            item={item}
            key={item.id}
            onActivate={() => setActiveId(item.id)}
            onStop={stop}
          />
        ))}
      </TripperProfileCarousel>
    </section>
  );
}
