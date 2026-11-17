"use client";

import type { ReactNode } from "react";
import Img from "@/components/common/Img";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import styles from "./traveler-trip-details.module.css";

interface TripGuidePhotosProps {
  copy: Pick<TripItineraryDict["guide"], "photosLabel" | "photoPrev" | "photoNext" | "photoGoTo">;
  photos: string[];
  caption: ReactNode;
}

/**
 * EmblaCarousel's fits-without-scrolling check counts whole `slideWidth`s per
 * viewport; a width wider than any screen means "one photo per view", so two
 * or more photos always scroll.
 */
const ONE_PER_VIEW = 100_000;

/**
 * Destination photo carousel for the guide intro, on the site's shared
 * `EmblaCarousel` (its arrows and dots, localized labels), one full-width
 * photo per view, caption below. A single photo renders without controls.
 */
export function TripGuidePhotos({ copy, photos, caption }: TripGuidePhotosProps) {
  return (
    <figure aria-label={copy.photosLabel} className={styles.guidePhoto} data-component="TripGuidePhotos">
      <EmblaCarousel
        arrowsClassName={styles.guidePhotoArrows}
        ariaLabels={{
          prev: copy.photoPrev,
          next: copy.photoNext,
          slide: (n) => interpolateTemplate(copy.photoGoTo, { n: String(n) }),
        }}
        slideClassName="flex-[0_0_100%] sm:flex-[0_0_100%]"
        slideWidth={ONE_PER_VIEW}
        slidesPerView={2}
      >
        {photos.map((src) => (
          <Img alt="" className="h-full w-full object-cover" key={src} src={src} />
        ))}
      </EmblaCarousel>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
