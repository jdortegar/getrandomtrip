'use client';

import React from 'react';
import { motion } from 'framer-motion';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import ExcuseCard from '@/components/journey/ExcuseCard';
import type { ExcuseData } from '@/lib/data/shared/excuses';

interface ExcusesCarouselProps {
  ctaLabel?: string;
  excuses: ExcuseData[];
  itemsPerView?: number;
  /** Localized excuse titles/descriptions by key (e.g. journey.excuses). */
  localizedExcuses?: Array<{ key: string; title: string; description: string }>;
  onSelect?: (excuseKey: string) => void;
  selectedExcuse?: string;
}

export function ExcusesCarousel({
  ctaLabel,
  excuses,
  itemsPerView = 3,
  localizedExcuses,
  onSelect,
  selectedExcuse,
}: ExcusesCarouselProps) {
  const handleCardClick = (excuse: ExcuseData) => {
    onSelect?.(excuse.key);
  };

  const getTitle = (excuse: ExcuseData) =>
    localizedExcuses?.find((e) => e.key === excuse.key)?.title ?? excuse.title;
  const getDescription = (excuse: ExcuseData) =>
    localizedExcuses?.find((e) => e.key === excuse.key)?.description ??
    excuse.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <EmblaCarousel slidesPerView={itemsPerView}>
        {excuses.map((excuse) => {
          const isSelected = selectedExcuse === excuse.key;

          return (
            <ExcuseCard
              key={excuse.key}
              className="h-full w-full"
              ctaLabel={ctaLabel}
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
