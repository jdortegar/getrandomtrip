'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EmblaCarousel } from '@/components/EmblaCarousel';
import ExcuseCard from '@/components/journey/ExcuseCard';
import type { ExcuseData } from '@/lib/data/shared/excuses';

interface ExcusesCarouselProps {
  classes?: {
    section?: string;
    viewport?: string;
    wrapper?: string;
  };
  excuses: ExcuseData[];
  fullViewportWidth?: boolean;
  itemsPerView?: number;
  /** Localized excuse titles/descriptions by key (e.g. journey.excuses). */
  localizedExcuses?: Array<{ key: string; title: string; description: string }>;
  onSelect?: (excuseKey: string) => void;
  selectedExcuse?: string;
  showArrows?: boolean;
  showDots?: boolean;
}

export function ExcusesCarousel({
  classes,
  excuses,
  fullViewportWidth = false,
  itemsPerView = 3,
  localizedExcuses,
  onSelect,
  selectedExcuse,
  showArrows = false,
  showDots = true,
}: ExcusesCarouselProps) {
  const handleCardClick = (excuse: ExcuseData) => {
    onSelect?.(excuse.key);
  };

  const getTitle = (excuse: ExcuseData) =>
    localizedExcuses?.find((e) => e.key === excuse.key)?.title ?? excuse.title;
  const getDescription = (excuse: ExcuseData) =>
    localizedExcuses?.find((e) => e.key === excuse.key)?.description ?? excuse.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <EmblaCarousel
        align={excuses.length < itemsPerView ? 'center' : 'start'}
        className={classes?.wrapper}
        gap={16}
        showArrows={showArrows}
        showDots={showDots}
        slidesPerView={itemsPerView}
        slidesToScroll={1}
        viewportClassName={classes?.viewport}
      >
        {excuses.map((excuse) => {
          const isSelected = selectedExcuse === excuse.key;

          return (
            <ExcuseCard
              key={excuse.key}
              className="h-full w-full"
              description={getDescription(excuse)}
              imageUrl={excuse.img}
              onClick={onSelect ? () => handleCardClick(excuse) : undefined}
              selected={isSelected}
              title={getTitle(excuse)}
            />
          );
        })}
      </EmblaCarousel>
    </motion.div>
  );
}
