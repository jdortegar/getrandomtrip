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
  travelTypeLabel: string;
}

interface BudgetStepProps {
  accordionValue: string;
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
}

export default function BudgetStep({
  accordionValue,
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
}: BudgetStepProps) {
  const hasTravelType = Boolean(travelerType);
  const plannerContent = hasTravelType
    ? getPlannerContentForType(travelerType as TravelerTypeSlug, locale)
    : null;

  return (
    <div>
      <Accordion
        collapsible
        onValueChange={onAccordionValueChange}
        type="single"
        value={accordionValue}
      >
        <JourneyDropdown
          className="mb-4 "
          content={travelTypeContent}
          label={labels.travelTypeLabel}
          value="travel-type"
        >
          <TravelerTypesCarousel
            localizedTravelerTypes={localizedTravelerTypes}
            onSelect={handleTravelTypeSelect}
            selectedTravelType={selectedTravelType}
          />
        </JourneyDropdown>

        {hasTravelType && plannerContent && (
          <JourneyDropdown
            content={experienceContent}
            label={labels.experienceLabel}
            value="experience"
          >
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
              />
            </div>
          </JourneyDropdown>
        )}
      </Accordion>
    </div>
  );
}
