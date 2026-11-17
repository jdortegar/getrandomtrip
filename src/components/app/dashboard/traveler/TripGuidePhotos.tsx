"use client";

import { useState, type ReactNode } from "react";
import Img from "@/components/common/Img";
import { useEmblaSnapshot } from "@/components/EmblaCarousel/useEmblaSnapshot";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TripGuidePhotosProps {
  copy: Pick<TripItineraryDict["guide"], "photosLabel" | "photoPrev" | "photoNext">;
  photos: string[];
  caption: ReactNode;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Destination photo carousel for the guide intro, on the shared `ui/carousel`
 * (incl. its prev/next buttons, restyled square and placed in the caption
 * bar): caption on the left, "01 / 07" and the arrows bottom right, no dots.
 * A single photo renders without controls.
 */
export function TripGuidePhotos({ copy, photos, caption }: TripGuidePhotosProps) {
  const [api, setApi] = useState<CarouselApi>();
  const selected = useEmblaSnapshot(api, (current) => current.selectedScrollSnap(), 0);
  const multiple = photos.length > 1;

  return (
    <figure className={styles.guidePhoto} data-component="TripGuidePhotos">
      <Carousel aria-label={copy.photosLabel} opts={{ loop: multiple }} setApi={setApi}>
        <CarouselContent className={styles.guidePhotoTrack}>
          {photos.map((src, i) => (
            <CarouselItem
              aria-label={`${pad(i + 1)} / ${pad(photos.length)}`}
              className={styles.guidePhotoSlide}
              key={src}
            >
              <Img alt="" className="h-full w-full object-cover" src={src} />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className={styles.guidePhotoBar}>
          <figcaption>{caption}</figcaption>
          {multiple ? (
            <div className={styles.guidePhotoControls}>
              <span aria-live="polite" className={styles.guidePhotoCount}>
                {pad(selected + 1)} / {pad(photos.length)}
              </span>
              <CarouselPrevious aria-label={copy.photoPrev} className={styles.guidePhotoArrow} />
              <CarouselNext aria-label={copy.photoNext} className={styles.guidePhotoArrow} />
            </div>
          ) : null}
        </div>
      </Carousel>
    </figure>
  );
}
