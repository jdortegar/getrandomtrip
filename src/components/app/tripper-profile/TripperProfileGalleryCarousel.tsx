"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import Img from "@/components/common/Img";
import { TripperProfileCarousel } from "@/components/app/tripper-profile/TripperProfileCarousel";
import { TripperProfileSectionHeading } from "@/components/app/tripper-profile/TripperProfileSectionHeading";
import { DialogTitle, Modal } from "@/components/ui/Modal";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileGalleryItem } from "@/types/tripper";

interface TripperProfileGalleryCarouselProps {
  carouselCopy: TripperPublicProfileDict["carousel"];
  copy: TripperPublicProfileDict["gallery"];
  items: TripperProfileGalleryItem[];
  name: string;
}

function isLocalUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** "Small things. Big stories.": photos open larger; videos play inline with native controls. */
export function TripperProfileGalleryCarousel({ carouselCopy, copy, items, name }: TripperProfileGalleryCarouselProps) {
  const [openItem, setOpenItem] = useState<TripperProfileGalleryItem | null>(null);
  if (items.length === 0) return null;
  const captionOf = (item: TripperProfileGalleryItem) =>
    item.caption.trim() || interpolateTemplate(copy.fallbackCaption, { name });

  return (
    <section aria-labelledby="tripper-gallery-title" className="rt-container py-12 md:py-16" data-component="TripperProfileGalleryCarousel">
      <TripperProfileSectionHeading aside={copy.aside} eyebrow={copy.eyebrow} id="tripper-gallery-title" title={copy.title} />
      <TripperProfileCarousel ariaLabel={copy.title} copy={carouselCopy}>
        {items.map((item) => (
          <figure className="flex h-full flex-col overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-gray-200" key={item.id}>
            <div className="relative h-[330px] bg-gray-200 lg:h-[340px]">
              {item.kind === "video" ? (
                <video className="absolute inset-0 h-full w-full object-cover" controls preload="metadata" src={item.url} />
              ) : (
                <button
                  aria-label={`${copy.enlarge}: ${captionOf(item)}`}
                  className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary"
                  onClick={() => setOpenItem(item)}
                  type="button"
                >
                  <Img
                    alt={captionOf(item)}
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="(min-width: 1024px) 33vw, 85vw"
                    src={item.url}
                    unoptimized={isLocalUrl(item.url)}
                  />
                  <Maximize2
                    aria-hidden
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 p-2 text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </button>
              )}
            </div>
            <figcaption className="min-h-[4.75rem] p-4 text-sm text-neutral-600">{captionOf(item)}</figcaption>
          </figure>
        ))}
      </TripperProfileCarousel>

      <Modal className="max-w-4xl p-3 sm:p-4" onOpenChange={(open) => !open && setOpenItem(null)} open={!!openItem}>
        {openItem ? (
          <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
              <Img
                alt={captionOf(openItem)}
                className="absolute inset-0 h-full w-full object-contain"
                sizes="900px"
                src={openItem.url}
                unoptimized={isLocalUrl(openItem.url)}
              />
            </div>
            <DialogTitle className="px-1 pt-3 text-sm font-normal text-neutral-700">{captionOf(openItem)}</DialogTitle>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
