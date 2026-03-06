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
  fullViewportWidth?: boolean;
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
  fullViewportWidth = false,
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
    <div className="relative flex min-h-[650px] w-full flex-col @container">
      <EmblaCarousel
        align={content.levels.length < itemsPerView ? 'center' : 'start'}
        className={cn('flex flex-1 flex-col min-h-0', classes?.wrapper)}
        contentClassName="h-full items-stretch"
        gap={gap}
        showArrows={showArrows}
        showDots={showDots}
        slideClassName="h-full"
        slidesPerView={itemsPerView}
        slidesToScroll={1}
        viewportClassName="h-full min-h-[650px]"
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
    >
      {contentElement}
    </Section>
  );
}
