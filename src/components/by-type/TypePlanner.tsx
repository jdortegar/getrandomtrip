"use client";

import { useState } from "react";
import Section from "@/components/layout/Section";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import LevelCard from "@/components/by-type/shared/LevelCard";
import type { TypePlannerContent } from "@/types/planner";
import {
  normalizePriceLevelId,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";

interface TypePlannerProps {
  /**
   * Badge signal only (curated journey) — level ids the tripper actually has
   * ACTIVE content for. `undefined` means no tripper context at all (no
   * badges anywhere); a defined list (possibly empty) badges each level
   * card "BY TRIPPER {name}" when included, "BY RANDOMTRIP" when not.
   * Nothing is ever hidden by this.
   */
  allowedLevelIds?: string[];
  compact?: boolean;
  content: TypePlannerContent;
  minimizeAllFeatures?: boolean;
  navigateOnCardClick?: boolean;
  onSelect?: (levelId: string) => void;
  selectedLevel?: string;
  type: TravelerTypeSlug;
  itemsPerView?: 2 | 3 | 4;
  cardClassName?: string;
  /** Tripper branding — when defined alongside `allowedLevelIds`, shown on each offered level card. */
  tripperBadge?: { name: string; avatarUrl: string | null };
}

export default function TypePlanner({
  allowedLevelIds,
  compact = false,
  content,
  minimizeAllFeatures = false,
  navigateOnCardClick = false,
  onSelect,
  selectedLevel: externalSelectedLevel,
  type,
  itemsPerView = 4,
  cardClassName,
  tripperBadge,
}: TypePlannerProps) {
  const [internalSelectedLevel, setInternalSelectedLevel] = useState<
    string | null
  >(null);

  const selectedLevel = externalSelectedLevel ?? internalSelectedLevel;

  // `allowedLevelIds` comes from raw Prisma `Experience.level` values
  // ("essenza", "explora", "atelier", ...); `level.id` is a `LevelSlug`
  // ("modo-explora", "atelier-getaway", ...) — both must normalize to the
  // same canonical `PriceLevelId` before comparing, or "explora"/"atelier"
  // would never match and always read as RandomTrip's even when the tripper
  // does offer them.
  const normalizedAllowedLevelIds = allowedLevelIds
    ? new Set(
        allowedLevelIds
          .map((id) => normalizePriceLevelId(id))
          .filter((id): id is NonNullable<typeof id> => id !== null),
      )
    : undefined;

  const handleLevelSelect = (levelId: string) => {
    setInternalSelectedLevel(levelId);
    onSelect?.(levelId);
  };

  const contentElement = (
    <div className="relative flex w-full flex-col">
      <EmblaCarousel slidesPerView={itemsPerView} overflow="both">
        {content.levels.map((level, index) => {
          // Alternate between light and dark variants
          const variant = index % 2 === 0 ? "light" : "dark";
          // Featured state: exploraPlus or index 2
          const isFeatured = index === 2;

          const tripperContext = normalizedAllowedLevelIds !== undefined;
          const availableFromTripper =
            normalizedAllowedLevelIds?.has(normalizePriceLevelId(level.id)!) ??
            false;

          return (
            <div className=" w-full min-w-0 py-3" key={level.id}>
              <LevelCard
                featured={isFeatured}
                level={level}
                minimizeAllFeatures={minimizeAllFeatures}
                navigateOnCardClick={navigateOnCardClick}
                onSelect={handleLevelSelect}
                selected={selectedLevel === level.id}
                showRandomtripBadge={tripperContext && !availableFromTripper}
                travelerType={type}
                tripperBadge={availableFromTripper ? tripperBadge : undefined}
                variant={variant}
                className={cardClassName}
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
      fullWidth
    >
      {contentElement}
    </Section>
  );
}
