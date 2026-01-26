'use client';

import React from 'react';
import { Carousel } from '@/components/Carousel';
import { motion } from 'framer-motion';
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
  onSelect,
  selectedExcuse,
  showArrows = false,
  showDots = true,
}: ExcusesCarouselProps) {
  const handleCardClick = (excuse: ExcuseData) => {
    onSelect?.(excuse.key);
  };

  // Calculate basis percentage for items per view
  const getItemClassName = () => {
    if (itemsPerView) {
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
        classes={{ ...classes }}
        fullViewportWidth={fullViewportWidth}
        itemClassName={getItemClassName()}
        showArrows={showArrows}
        showDots={showDots}
        slidesToScroll={itemsPerView || 1}
      >
        {excuses.map((excuse) => {
          const isSelected = selectedExcuse === excuse.key;

          return (
            <ExcuseCard
              key={excuse.key}
              className="h-full w-full"
              description={excuse.description}
              imageUrl={excuse.img}
              onClick={onSelect ? () => handleCardClick(excuse) : undefined}
              selected={isSelected}
              title={excuse.title}
            />
          );
        })}
      </Carousel>
    </motion.div>
  );
}
