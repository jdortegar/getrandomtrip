'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import { Carousel } from '@/components/Carousel';
import LevelCard from '@/components/by-type/shared/LevelCard';
import type { TypePlannerContent } from '@/types/planner';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TypePlannerProps {
  classes?: {
    wrapper?: string;
  };
  compact?: boolean;
  content: TypePlannerContent;
  fullViewportWidth?: boolean;
  onSelect?: (levelId: string) => void;
  selectedLevel?: string;
  showArrows?: boolean;
  showDots?: boolean;
  type: TravelerTypeSlug;
  itemsPerView?: number;
}

export default function TypePlanner({
  classes,
  compact = false,
  content,
  fullViewportWidth = false,
  onSelect,
  selectedLevel: externalSelectedLevel,
  showArrows = true,
  showDots = true,
  type,
  itemsPerView = 4,
}: TypePlannerProps) {
  const [internalSelectedLevel, setInternalSelectedLevel] = useState<
    string | null
  >(null);

  const selectedLevel = externalSelectedLevel ?? internalSelectedLevel;

  const handleLevelSelect = (levelId: string) => {
    setInternalSelectedLevel(levelId);
    onSelect?.(levelId);
  };

  const getItemClassName = () => {
    if (itemsPerView) {
      // Calculate: (100% - (gap * (itemsPerView - 1))) / itemsPerView
      // gap-x-4 = 16px, so we need to account for (itemsPerView - 1) gaps
      const gapPx = 16;
      const totalGaps = gapPx * (itemsPerView - 1);
      return `basis-[calc((100%-${totalGaps}px)/${itemsPerView})] flex-shrink-0`;
    }
    return 'w-[280px] h-[332px] flex-shrink-0';
  };

  const contentElement = (
    <div className="relative">
      <Carousel
        classes={{ ...classes, content: 'items-start' }}
        fullViewportWidth={fullViewportWidth}
        itemClassName={getItemClassName()}
        showArrows={showArrows}
        showDots={showDots}
        slidesToScroll={1}
      >
        {content.levels.map((level, index) => {
          // Alternate between light and dark variants
          const variant = index % 2 === 0 ? 'light' : 'dark';
          // Featured state: exploraPlus or index 2
          const isFeatured = index === 2;

          return (
            <LevelCard
              featured={isFeatured}
              key={level.id}
              level={level}
              onSelect={handleLevelSelect}
              selected={selectedLevel === level.id}
              travelerType={type}
              variant={variant}
            />
          );
        })}
      </Carousel>

      {type === 'paws' && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 italic">
            * Sujeto a disponibilidad y políticas pet-friendly de cada
            proveedor. Pueden aplicar requisitos (certificados sanitarios,
            vacunas, microchip, etc.).
          </p>
        </div>
      )}
    </div>
  );

  if (compact) {
    return contentElement;
  }

  return (
    <Section
      eyebrow={content.eyebrow}
      subtitle={content.subtitle}
      title={content.title}
    >
      {contentElement}
    </Section>
  );
}
