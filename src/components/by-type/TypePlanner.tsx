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
      className="py-20"
      fullWidth={true}
      eyebrow={content.eyebrow}
      subtitle={content.subtitle}
      title={content.title}
    >
      <div className="relative">
        <div id={`${type}-planner`} className="h-0 scroll-mt-24" />
        <div className="mt-8 overflow-visible px-4 [&_[data-slot=carousel-content]]:overflow-visible">
          <Carousel
            edgeBleed={false}
            itemClassName="basis-full md:basis-[55%] lg:basis-[27.5%]"
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
      </div>
    </Section>
  );
}
