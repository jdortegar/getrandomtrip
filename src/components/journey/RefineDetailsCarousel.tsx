'use client';

import React from 'react';
import { Carousel } from '@/components/Carousel';
import { motion } from 'framer-motion';
import RefineDetailsCard from '@/components/journey/RefineDetailsCard';

interface RefineDetailsOption {
  desc: string;
  img: string;
  key: string;
  label: string;
}

interface RefineDetailsCarouselProps {
  classes?: {
    section?: string;
    viewport?: string;
    wrapper?: string;
  };
  fullViewportWidth?: boolean;
  itemsPerView?: number;
  onSelect?: (optionKey: string) => void;
  options: RefineDetailsOption[];
  selectedOptions?: string[];
  showArrows?: boolean;
  showDots?: boolean;
}

export function RefineDetailsCarousel({
  classes,
  fullViewportWidth = false,
  itemsPerView = 3,
  onSelect,
  options,
  selectedOptions = [],
  showArrows = false,
  showDots = false,
}: RefineDetailsCarouselProps) {
  const handleCardClick = (option: RefineDetailsOption) => {
    onSelect?.(option.key);
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
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.key);

          return (
            <RefineDetailsCard
              key={option.key}
              className="h-full w-full"
              description={option.desc}
              imageUrl={option.img}
              onClick={onSelect ? () => handleCardClick(option) : undefined}
              selected={isSelected}
              title={option.label}
            />
          );
        })}
      </Carousel>
    </motion.div>
  );
}
