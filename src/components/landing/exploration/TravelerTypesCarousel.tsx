'use client';

import React from 'react';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { Carousel } from '@/components/Carousel';
import { motion } from 'framer-motion';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TravelerTypesCarouselProps {
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
}

export function TravelerTypesCarousel({
  showArrows = true,
  showDots = true,
  classes,
  fullViewportWidth,
  itemsPerView = 4,
  onSelect,
  selectedTravelType,
}: TravelerTypesCarouselProps) {
  // Map travelType (Couple, Solo, etc.) to slug (couple, solo, etc.)
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

  const handleCardClick = (type: (typeof initialTravellerTypes)[0]) => {
    if (!type.enabled || !onSelect) return;
    const slug = getSlugFromTravelType(type.travelType);
    onSelect(slug);
  };

  // Calculate basis percentage for items per view
  // Using basis with calc to account for gaps (gap-x-4 = 16px)
  const getItemClassName = () => {
    if (itemsPerView) {
      // Calculate: (100% - (gap * (itemsPerView - 1))) / itemsPerView
      // gap-x-4 = 16px, so we need to account for (itemsPerView - 1) gaps
      const gapPx = 16;
      const totalGaps = gapPx * (itemsPerView - 1);
      return `basis-[calc((100%-${totalGaps}px)/${itemsPerView})] h-[332px] flex-shrink-0`;
    }
    return 'w-[280px] h-[332px] flex-shrink-0';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Carousel
        itemClassName={getItemClassName()}
        slidesToScroll={itemsPerView || 1}
        fullViewportWidth={fullViewportWidth}
        classes={{ ...classes }}
        showArrows={showArrows}
        showDots={showDots}
      >
        {initialTravellerTypes.map((type) => {
          const slug = getSlugFromTravelType(type.travelType);
          const isSelected = selectedTravelType === slug;

          return (
            <TravelerTypeCard
              key={type.title}
              className="h-full w-full"
              description={type.description}
              disabled={!type.enabled}
              href={
                onSelect
                  ? undefined
                  : `/packages/by-type/${slugify(type.travelType)}`
              }
              imageUrl={type.imageUrl}
              onClick={onSelect ? () => handleCardClick(type) : undefined}
              selected={isSelected}
              title={type.title}
            />
          );
        })}
      </Carousel>
    </motion.div>
  );
}
