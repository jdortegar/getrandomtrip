"use client";

import { useState } from "react";
import Section from "@/components/layout/Section";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import LevelCard from "@/components/by-type/shared/LevelCard";
import type { TypePlannerContent } from "@/types/planner";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

interface TypePlannerProps {
  compact?: boolean;
  content: TypePlannerContent;
  minimizeAllFeatures?: boolean;
  navigateOnCardClick?: boolean;
  onSelect?: (levelId: string) => void;
  selectedLevel?: string;
  type: TravelerTypeSlug;
  itemsPerView?: number;
}

export default function TypePlanner({
  compact = false,
  content,
  minimizeAllFeatures = false,
  navigateOnCardClick = false,
  onSelect,
  selectedLevel: externalSelectedLevel,
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

  const contentElement = (
    <div className="relative flex w-full flex-col">
      <EmblaCarousel slidesPerView={itemsPerView}>
        {content.levels.map((level, index) => {
          // Alternate between light and dark variants
          const variant = index % 2 === 0 ? "light" : "dark";
          // Featured state: exploraPlus or index 2
          const isFeatured = index === 2;

          return (
            <div className="@container w-full min-w-0 py-3" key={level.id}>
              <LevelCard
                featured={isFeatured}
                level={level}
                minimizeAllFeatures={minimizeAllFeatures}
                navigateOnCardClick={navigateOnCardClick}
                onSelect={handleLevelSelect}
                selected={selectedLevel === level.id}
                travelerType={type}
                variant={variant}
              />
            </div>
          );
        })}
      </EmblaCarousel>

      {type === "paws" && (
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
      <div className="container mx-auto mt-12 flex justify-center overflow-x-visible px-4 md:px-20">
        {contentElement}
      </div>
    </Section>
  );
}
