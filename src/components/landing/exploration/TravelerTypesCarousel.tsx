'use client';

import React from 'react';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import {
  initialTravellerTypes,
  type TravelerType,
} from '@/lib/data/travelerTypes';
import { EmblaCarousel } from '@/components/EmblaCarousel';
import { motion } from 'framer-motion';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TravelerTypesCarouselProps {
  /** When set, only these traveler type slugs are shown (e.g. tripper’s available types). */
  availableTypes?: string[];
  /** Localized aria-label for carousel next button. */
  ariaLabelNext?: string;
  /** Localized aria-label for carousel previous button. */
  ariaLabelPrev?: string;
  /** Localized aria-label for dot "Go to slide N". Use {n} for slide number (1-based). */
  ariaLabelSlide?: string;
  classes?: {
    section?: string;
    viewport?: string;
    wrapper?: string;
  };
  /** When true, carousel can break out of container to full viewport width. */
  fullViewportWidth?: boolean;
  itemsPerView?: number;
  /** Localized traveler type labels from dictionary (home.exploration.travelerTypes). Merged with base data to produce card content. */
  localizedTravelerTypes?: Array<{ description: string; key: string; title: string }>;
  onSelect?: (slug: TravelerTypeSlug) => void;
  /** Pixels of the next slide to show (peek). */
  peek?: number;
  selectedTravelType?: TravelerTypeSlug;
  showArrows?: boolean;
  showDots?: boolean;
  /** When true, ONLY show types in availableTypes; never show all. Use on tripper pages. */
  tripperMode?: boolean;
  /** When set, card links go to this tripper’s packages page. */
  tripperSlug?: string;
  /** Localized traveler types (title + description). When not set, uses initialTravellerTypes (or merged with localizedTravelerTypes when provided). */
  travelerTypes?: TravelerType[];
  /** When true (default), viewport clips overflow (overflow-hidden). When false, next slide can peek (overflow-visible). */
  hideOverflow?: boolean;
}

export function TravelerTypesCarousel({
  availableTypes,
  ariaLabelNext,
  ariaLabelPrev,
  ariaLabelSlide,
  classes,
  fullViewportWidth: _fullViewportWidth,
  itemsPerView = 3,
  localizedTravelerTypes,
  onSelect,
  peek = 0,
  selectedTravelType,
  showArrows = true,
  showDots = true,
  travelerTypes,
  tripperMode = false,
  tripperSlug,
  hideOverflow = true,
}: TravelerTypesCarouselProps) {
  const baseTypes = React.useMemo(() => {
    if (travelerTypes?.length) return travelerTypes;
    if (localizedTravelerTypes?.length) {
      const byKey = Object.fromEntries(
        localizedTravelerTypes.map((t) => [t.key.toLowerCase(), t]),
      );
      return initialTravellerTypes.map((type) => {
        const loc = byKey[type.travelType.toLowerCase()];
        return loc
          ? { ...type, description: loc.description, title: loc.title }
          : type;
      });
    }
    return initialTravellerTypes;
  }, [travelerTypes, localizedTravelerTypes]);

  const isTripperContext = tripperMode || Boolean(tripperSlug);
  const allowedSet = React.useMemo(() => {
    if (!availableTypes?.length) return null;
    return new Set(availableTypes.map((t) => String(t).toLowerCase().trim()));
  }, [availableTypes]);

  const typesToShow = React.useMemo(() => {
    if (isTripperContext) {
      if (!allowedSet?.size) return [];
      return baseTypes.filter((t) =>
        allowedSet.has(t.travelType.toLowerCase()),
      );
    }
    if (!allowedSet) return baseTypes;
    return baseTypes.filter((t) =>
      allowedSet.has(t.travelType.toLowerCase()),
    );
  }, [isTripperContext, allowedSet, baseTypes]);

  function getSlug(t: TravelerType): TravelerTypeSlug {
    return t.travelType.toLowerCase() as TravelerTypeSlug;
  }

  function getHref(t: TravelerType): string {
    return `/packages/by-type/${slugify(t.travelType)}`;
  }

  if (isTripperContext && !typesToShow.length) {
    return null;
  }

  const gapPx = 16;
  const fewerSlidesThanView = typesToShow.length <= itemsPerView;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <EmblaCarousel
        align={fewerSlidesThanView ? 'center' : 'start'}
        ariaLabelNext={ariaLabelNext}
        ariaLabelPrev={ariaLabelPrev}
        ariaLabelSlide={ariaLabelSlide}
        className={classes?.section}
        contentClassName={classes?.wrapper}
        gap={gapPx}
        peek={peek}
        showArrows={showArrows && !fewerSlidesThanView}
        showDots={showDots && !fewerSlidesThanView}
        slidesPerView={itemsPerView}
        slidesToScroll={itemsPerView}
        viewportClassName={classes?.viewport}
        hideOverflow={hideOverflow}
      >
        {typesToShow.map((t) => (
          <div key={t.travelType} className="aspect-[280/332] w-full min-h-0">
            <TravelerTypeCard
              fill
              href={getHref(t)}
              item={t}
              onClick={onSelect ? () => onSelect(getSlug(t)) : undefined}
              selected={selectedTravelType === getSlug(t)}
            />
          </div>
        ))}
      </EmblaCarousel>
    </motion.div>
  );
}
