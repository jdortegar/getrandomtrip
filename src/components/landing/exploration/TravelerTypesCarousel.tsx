'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import {
  cardDataToCardItem,
  filterCarouselCards,
  getCarouselCardOptions,
  type TravelerTypeCardData,
} from '@/lib/utils/experiencesData';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import { motion } from 'framer-motion';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TravelerTypesCarouselProps {
  /** When set, only these traveler type slugs are shown. In tripper context, only these are shown; otherwise all are shown unless this filters them. */
  availableTypes?: string[];
  /** Unused – kept for API compatibility. */
  ariaLabelNext?: string;
  /** Unused – kept for API compatibility. */
  ariaLabelPrev?: string;
  /** Unused – kept for API compatibility. */
  ariaLabelSlide?: string;
  /** Unused – kept for API compatibility. */
  fullViewportWidth?: boolean;
  /** Unused – kept for API compatibility. */
  hideOverflow?: boolean;
  /** Unused – kept for API compatibility. */
  itemsPerView?: number;
  /** Localized labels from dictionary (home.exploration.travelerTypes). Merged with base data. */
  localizedTravelerTypes?: Array<{
    description: string;
    key: string;
    title: string;
  }>;
  onSelect?: (slug: TravelerTypeSlug) => void;
  selectedTravelType?: TravelerTypeSlug;
  /** Unused – kept for API compatibility. */
  showArrows?: boolean;
  /** Unused – kept for API compatibility. */
  showDots?: boolean;
  /** When true, only show types in availableTypes; hide carousel if none. Use on tripper pages. */
  tripperMode?: boolean;
  /** When set, card links go to this tripper's packages page (tripper context). */
  tripperSlug?: string;
  
}

export function TravelerTypesCarousel({
  availableTypes,
  localizedTravelerTypes,
  onSelect,
  selectedTravelType,
  
  tripperMode = false,
  tripperSlug,
}: TravelerTypesCarouselProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';

  const cards = getCarouselCardOptions(locale, {
    localizedTravelerTypes,
  });

  const tripperContext = tripperMode || Boolean(tripperSlug);
  const typesToShow = filterCarouselCards(cards, {
    availableTypes,
    tripperContext,
  });

  if (tripperContext && typesToShow.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <EmblaCarousel slidesPerView={3}>
        {typesToShow.map((t) => {
          const slug = t.key.toLowerCase() as TravelerTypeSlug;
          const href = `/packages/by-type/${slugify(t.key)}`;
          return (
            <div
              key={t.key}
              className="aspect-[280/332] w-full min-h-0"
            >
              <TravelerTypeCard
                fill
                href={href}
                item={cardDataToCardItem(t)}
                onClick={onSelect ? () => onSelect(slug) : undefined}
                selected={selectedTravelType === slug}
              />
            </div>
          );
        })}
      </EmblaCarousel>
    </motion.div>
  );
}
