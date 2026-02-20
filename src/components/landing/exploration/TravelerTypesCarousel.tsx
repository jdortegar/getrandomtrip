'use client';

import React from 'react';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
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
}

export function TravelerTypesCarousel({
  availableTypes,
  showArrows = true,
  showDots = true,
  classes,
  fullViewportWidth,
  itemsPerView = 4,
  onSelect,
  selectedTravelType,
  tripperMode = false,
  tripperSlug,
}: TravelerTypesCarouselProps) {
  const getSlugFromTravelType = (travelType: string): TravelerTypeSlug => {
    const normalized = travelType.toLowerCase();
    const mapping: Record<string, TravelerTypeSlug> = {
      couple: 'couple',
      solo: 'solo',
      family: 'family',
      group: 'group',
      honeymoon: 'honeymoon',
      paws: 'paws',
    };
    return mapping[normalized] || (normalized as TravelerTypeSlug);
  };

  const isTripperContext = tripperMode || Boolean(tripperSlug);
  const allowedSet = React.useMemo(() => {
    if (!availableTypes || availableTypes.length === 0) return null;
    return new Set(availableTypes.map((t) => String(t).toLowerCase().trim()));
  }, [availableTypes]);

  const typesToShow = React.useMemo(() => {
    if (isTripperContext) {
      if (!allowedSet || allowedSet.size === 0) return [];
      return initialTravellerTypes.filter((type) =>
        allowedSet.has(type.travelType.toLowerCase()),
      );
    }
    if (!allowedSet) return initialTravellerTypes;
    return initialTravellerTypes.filter((type) =>
      allowedSet.has(type.travelType.toLowerCase()),
    );
  }, [isTripperContext, allowedSet]);

  const handleCardClick = (type: (typeof initialTravellerTypes)[0]) => {
    if (!type.enabled || !onSelect) return;
    const slug = getSlugFromTravelType(type.travelType);
    onSelect(slug);
  };

  const getItemClassName = () => {
    if (itemsPerView) {
      const gapPx = 16;
      const totalGaps = gapPx * (itemsPerView - 1);
      return `basis-[calc((100%-${totalGaps}px)/${itemsPerView})] h-[332px] flex-shrink-0`;
    }
    return 'w-[280px] h-[332px] flex-shrink-0';
  };

  const getHref = (type: (typeof initialTravellerTypes)[0]) => {
    if (onSelect) return undefined;
    if (tripperSlug) {
      return `/packages/by-tripper/${tripperSlug}`;
    }
    return `/packages/by-type/${slugify(type.travelType)}`;
  };

  if (isTripperContext && typesToShow.length === 0) {
    return null;
  }

  const singleSlide = typesToShow.length === 1;
  const type = typesToShow[0];

  if (singleSlide && type) {
    const slug = getSlugFromTravelType(type.travelType);
    const isSelected = selectedTravelType === slug;
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
            description={type.description}
            disabled={!type.enabled}
            href={getHref(type)}
            imageUrl={type.imageUrl}
            onClick={onSelect ? () => handleCardClick(type) : undefined}
            selected={isSelected}
            title={type.title}
          />
        </div>
      </motion.div>
    );
  }

  const allFitInOneView = typesToShow.length <= itemsPerView;

  if (allFitInOneView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex w-full justify-center gap-4 md:gap-6 lg:gap-8"
      >
        {typesToShow.map((t) => {
          const slug = getSlugFromTravelType(t.travelType);
          const isSelected = selectedTravelType === slug;
          return (
            <div
              key={t.title}
              className="h-[332px] w-[280px] shrink-0"
            >
              <TravelerTypeCard
                className="h-full w-full"
                description={t.description}
                disabled={!t.enabled}
                href={getHref(t)}
                imageUrl={t.imageUrl}
                onClick={onSelect ? () => handleCardClick(t) : undefined}
                selected={isSelected}
                title={t.title}
              />
            </div>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Carousel
        classes={{ ...classes }}
        fullViewportWidth={fullViewportWidth}
        itemClassName={getItemClassName()}
        showArrows={showArrows}
        showDots={showDots}
        slidesToScroll={itemsPerView || 1}
      >
        {typesToShow.map((t) => {
          const slug = getSlugFromTravelType(t.travelType);
          const isSelected = selectedTravelType === slug;

          return (
            <TravelerTypeCard
              key={t.title}
              className="h-full w-full"
              description={t.description}
              disabled={!t.enabled}
              href={getHref(t)}
              imageUrl={t.imageUrl}
              onClick={onSelect ? () => handleCardClick(t) : undefined}
              selected={isSelected}
              title={t.title}
            />
          );
        })}
      </Carousel>
    </motion.div>
  );
}
