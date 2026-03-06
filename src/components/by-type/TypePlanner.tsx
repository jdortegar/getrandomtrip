'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import { EmblaCarousel } from '@/components/EmblaCarousel';
import LevelCard from '@/components/by-type/shared/LevelCard';
import { cn } from '@/lib/utils';
import type { TypePlannerContent } from '@/types/planner';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TypePlannerProps {
  classes?: {
    wrapper?: string;
  };
  compact?: boolean;
  content: TypePlannerContent;
  /** When true, planner can break out of container to full viewport width. */
  fullViewportWidth?: boolean;
  hideOverflow?: boolean;
  onSelect?: (levelId: string) => void;
  selectedLevel?: string;
  showArrows?: boolean;
  showDots?: boolean;
  type: TravelerTypeSlug;
  itemsPerView?: number;
  gap?: number;
}

export default function TypePlanner({
  classes,
  compact = false,
  content,
  fullViewportWidth: _fullViewportWidth,
  hideOverflow = true,
  onSelect,
  selectedLevel: externalSelectedLevel,
  showArrows = true,
  showDots = true,
  type,
  itemsPerView = 4,
  gap = 16,
}: TypePlannerProps) {
  const [internalSelectedLevel, setInternalSelectedLevel] = useState<
    string | null
  >(null);

  const selectedLevel = externalSelectedLevel ?? internalSelectedLevel;

  const handleLevelSelect = (levelId: string) => {
    setInternalSelectedLevel(levelId);
    onSelect?.(levelId);
  };

  const contentElement = (
    <div className="relative flex w-full flex-col">
      <EmblaCarousel
        align={content.levels.length < itemsPerView ? 'center' : 'start'}
        className={classes?.wrapper}
        
        gap={gap}
        showArrows={showArrows}
        showDots={showDots}
        slideClassName="h-full"
        slidesPerView={itemsPerView}
        slidesToScroll={1}
        viewportClassName="h-full"
        hideOverflow={hideOverflow}
      >
        {content.levels.map((level, index) => {
          // Alternate between light and dark variants
          const variant = index % 2 === 0 ? 'light' : 'dark';
          // Featured state: exploraPlus or index 2
          const isFeatured = index === 2;

          return (
            <div className="h-full @container">
            <LevelCard
              featured={isFeatured}
              key={level.id}
              level={level}
              onSelect={handleLevelSelect}
              selected={selectedLevel === level.id}
              travelerType={type}
              variant={variant}
            />
            </div>
          );
        })}
      </EmblaCarousel>

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
      id="type-planner"
    >
      {contentElement}
    </Section>
  );
}
