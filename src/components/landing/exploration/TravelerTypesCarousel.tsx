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
  classes?: {
    section?: string;
    viewport?: string;
    wrapper?: string;
  };
  fullViewportWidth?: boolean;
  itemsPerView?: number;
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
  /** Localized traveler types (title + description). When not set, uses initialTravellerTypes. */
  travelerTypes?: TravelerType[];
}

export function TravelerTypesCarousel({
  availableTypes,
  classes,
  fullViewportWidth,
  itemsPerView = 3,
  onSelect,
  peek = 0,
  selectedTravelType,
  showArrows = true,
  showDots = true,
  travelerTypes,
  tripperMode = false,
  tripperSlug,
}: TravelerTypesCarouselProps) {
  const baseTypes = travelerTypes ?? initialTravellerTypes;

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
  const fewerSlidesThanView = typesToShow.length < itemsPerView;

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
        className={classes?.section}
        contentClassName={classes?.wrapper}
        gap={gapPx}
        peek={peek}
        showArrows={showArrows}
        showDots={showDots}
        slidesPerView={itemsPerView}
        slidesToScroll={itemsPerView}
        viewportClassName={classes?.viewport}
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
