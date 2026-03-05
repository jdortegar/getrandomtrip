'use client';

import React from 'react';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import {
  initialTravellerTypes,
  type TravelerType,
} from '@/lib/data/travelerTypes';
import { Carousel } from '@/components/Carousel';
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
  itemsPerView = 4,
  onSelect,
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

  const slug = (t: TravelerType): TravelerTypeSlug =>
    t.travelType.toLowerCase() as TravelerTypeSlug;
  const href = (t: TravelerType) =>
    onSelect
      ? undefined
      : tripperSlug
        ? `/packages/by-tripper/${tripperSlug}`
        : `/packages/by-type/${slugify(t.travelType)}`;

  if (isTripperContext && !typesToShow.length) {
    return null;
  }

  if (typesToShow.length === 1) {
    const t = typesToShow[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex w-full justify-center"
      >
        <div className="w-full max-w-[280px]">
          <TravelerTypeCard
            className="h-full w-full"
            description={t.description}
            disabled={!t.enabled}
            href={href(t)}
            imageUrl={t.imageUrl}
            onClick={onSelect ? () => onSelect(slug(t)) : undefined}
            selected={selectedTravelType === slug(t)}
            title={t.title}
          />
        </div>
      </motion.div>
    );
  }

  if (typesToShow.length <= itemsPerView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex w-full justify-center gap-4 md:gap-6 lg:gap-8"
      >
        {typesToShow.map((t) => (
          <div key={t.travelType} className="h-[332px] w-[280px] shrink-0">
            <TravelerTypeCard
              className="h-full w-full"
              description={t.description}
              disabled={!t.enabled}
              href={href(t)}
              imageUrl={t.imageUrl}
              onClick={onSelect ? () => onSelect(slug(t)) : undefined}
              selected={selectedTravelType === slug(t)}
              title={t.title}
            />
          </div>
        ))}
      </motion.div>
    );
  }

  const gapPx = 16;
  const totalGaps = gapPx * (itemsPerView - 1);
  const itemClassName = `basis-[calc((100%-${totalGaps}px)/${itemsPerView})] h-[332px] flex-shrink-0`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Carousel
        classes={classes}
        fullViewportWidth={fullViewportWidth}
        itemClassName={itemClassName}
        showArrows={showArrows}
        showDots={showDots}
        slidesToScroll={itemsPerView}
      >
        {typesToShow.map((t) => (
          <TravelerTypeCard
            key={t.travelType}
            className="h-full w-full"
            description={t.description}
            disabled={!t.enabled}
            href={href(t)}
            imageUrl={t.imageUrl}
            onClick={onSelect ? () => onSelect(slug(t)) : undefined}
            selected={selectedTravelType === slug(t)}
            title={t.title}
          />
        ))}
      </Carousel>
    </motion.div>
  );
}
