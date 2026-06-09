"use client";

import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { TravelerTypesCarousel } from "@/components/landing/exploration/TravelerTypesCarousel";
import TypePlanner from "@/components/by-type/TypePlanner";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";

type TravelerTypeCardOption = {
  description: string;
  key: string;
  title: string;
};

interface BudgetStepLabels {
  experienceLabel: string;
  experienceStepDescription: string;
  selectTravelTypeFirst: string;
  travelTypeLabel: string;
}

interface BudgetStepProps {
  accordionValue: string;
  /**
   * When defined (curated journey), maps each type key to the allowed level ids.
   * After a type is selected, only levels in this list are shown.
   * When undefined, all levels are shown (current behavior).
   */
  allowedLevelsByType?: Record<string, string[]>;
  experienceContent: string;
  handleExperienceSelect: (levelId: string) => void;
  handleTravelTypeSelect: (slug: string) => void;
  labels: BudgetStepLabels;
  localizedTravelerTypes?: TravelerTypeCardOption[];
  locale: string;
  minimizeAllFeatures?: boolean;
  travelTypeContent: string;
  onAccordionValueChange: (next: string) => void;
  selectedExperienceLevel?: string;
  selectedTravelType?: TravelerTypeSlug;
  travelerType?: TravelerTypeSlug;
  /** Tripper branding — when defined, shown on each trip type card (curated journey). */
  tripperBadge?: { name: string; avatarUrl: string | null };
}

export default function BudgetStep({
  accordionValue,
  allowedLevelsByType,
  experienceContent,
  handleExperienceSelect,
  handleTravelTypeSelect,
  labels,
  localizedTravelerTypes,
  locale,
  minimizeAllFeatures = true,
  onAccordionValueChange,
  selectedExperienceLevel,
  selectedTravelType,
  travelerType,
  travelTypeContent,
  tripperBadge,
}: BudgetStepProps) {
  const hasTravelType = Boolean(travelerType);
  const rawPlannerContent = hasTravelType
    ? getPlannerContentForType(travelerType as TravelerTypeSlug, locale)
    : null;

  // Apply level filtering when a curated allowedLevelsByType is provided.
  const plannerContent = (() => {
    if (!rawPlannerContent) return null;
    if (!allowedLevelsByType || !travelerType) return rawPlannerContent;
    const allowedLevelIds = allowedLevelsByType[travelerType] ?? [];
    // Empty allowedLevelIds = no levels available for this type in curated journey.
    const filteredLevels = rawPlannerContent.levels.filter((l) =>
      allowedLevelIds.includes(l.id),
    );
    return { ...rawPlannerContent, levels: filteredLevels };
  })();

  // Force travel-type open until the user has made a selection
  const effectiveAccordionValue = !selectedTravelType
    ? "travel-type"
    : accordionValue;

  return (
    <div>
      <Accordion
        collapsible
        onValueChange={onAccordionValueChange}
        type="single"
        value={effectiveAccordionValue}
      >
        <JourneyDropdown
          className="mb-4 "
          content={travelTypeContent}
          label={labels.travelTypeLabel}
          value="travel-type"
        >
          <TravelerTypesCarousel
            overflow="right"
            localizedTravelerTypes={localizedTravelerTypes}
            onSelect={(slug) => {
              handleTravelTypeSelect(slug);
              onAccordionValueChange("travel-type");
            }}
            selectedTravelType={selectedTravelType}
            tripperBadge={tripperBadge}
          />
        </JourneyDropdown>

        <JourneyDropdown
          content={experienceContent}
          label={labels.experienceLabel}
          value="experience"
        >
          {hasTravelType && plannerContent && plannerContent.levels.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                {labels.experienceStepDescription}
              </p>
              <TypePlanner
                compact
                content={plannerContent}
                itemsPerView={2}
                minimizeAllFeatures={minimizeAllFeatures}
                onSelect={handleExperienceSelect}
                selectedLevel={selectedExperienceLevel}
                type={travelerType as TravelerTypeSlug}
                cardClassName="min-h-[450px]!"
              />
            </div>
          ) : hasTravelType && plannerContent && plannerContent.levels.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                No hay experiencias disponibles para este tipo de viaje.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">{labels.selectTravelTypeFirst}</p>
            </div>
          )}
        </JourneyDropdown>
      </Accordion>
    </div>
  );
}
