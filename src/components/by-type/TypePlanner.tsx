'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import { Carousel } from '@/components/Carousel';
import LevelCard from '@/components/by-type/shared/LevelCard';
import type { TypePlannerContent } from '@/types/planner';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TypePlannerProps {
  content: TypePlannerContent;
  type: TravelerTypeSlug;
}

export default function TypePlanner({ content, type }: TypePlannerProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    // TODO: Navigate to next step or handle selection
  };

  return (
    <Section
      eyebrow={content.eyebrow}
      subtitle={content.subtitle}
      title={content.title}
    >
      <div className="relative">
        <div id={`${type}-planner`} className="h-0 scroll-mt-24" />
        <div className="overflow-visible [&_[data-slot=carousel-content]]:overflow-visible">
          <Carousel
            edgeBleed={false}
            itemClassName="!basis-auto"
            classes={{
              content: 'items-start',
            }}
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
                  variant={variant}
                />
              );
            })}
          </Carousel>
        </div>

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
    </Section>
  );
}
