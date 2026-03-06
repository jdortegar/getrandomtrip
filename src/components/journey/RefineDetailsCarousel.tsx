'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EmblaCarousel } from '@/components/EmblaCarousel';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <EmblaCarousel
        align={options.length < itemsPerView ? 'center' : 'start'}
        className={classes?.wrapper}
        gap={16}
        showArrows={showArrows}
        showDots={showDots}
        slidesPerView={itemsPerView}
        slidesToScroll={1}
        viewportClassName={classes?.viewport}
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
      </EmblaCarousel>
    </motion.div>
  );
}
