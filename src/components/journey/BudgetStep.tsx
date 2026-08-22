"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { TravelerTypesCarousel } from "@/components/landing/exploration/TravelerTypesCarousel";
import TypePlanner from "@/components/by-type/TypePlanner";
import { Button } from "@/components/ui/Button";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import {
  getEffectiveTripperPriceOverrides,
  type TripperPriceOverrides,
} from "@/lib/pricing/tripper-price-overrides";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";

type TravelerTypeCardOption = {
  description: string;
  key: string;
  title: string;
};

interface BudgetStepLabels {
  browseGeneralExperiences: string;
  experienceLabel: string;
  experienceStepDescription: string;
  noLevelsAvailable: string;
  noTripperExperiences: string;
  selectTravelTypeFirst: string;
  travelTypeLabel: string;
}

interface BudgetStepProps {
  accordionValue: string;
  /**
   * When defined (curated journey), the types this tripper actually offers
   * (has an ACTIVE experience of). Gates `tripperPriceOverrides` so a price
   * override never applies to a type the tripper doesn't offer, even if
   * `travelerType` reaches this component outside the (also-filtered)
   * type-picker — e.g. a stale/direct `?travelType=` param. When undefined
   * (direct, non-curated journey), `tripperPriceOverrides` passes through
   * unchanged.
   */
  allowedTypes?: string[];
  /**
   * When defined (curated journey), which levels of the selected type the
   * tripper actually has ACTIVE content for — badge signal only, forwarded
   * to each level card so it reads "BY TRIPPER {name}" or "BY RANDOMTRIP",
   * same treatment as the type carousel. Nothing is ever hidden by this.
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
  /** This tripper's price overrides (curated journey). `null`/undefined for a direct journey. */
  tripperPriceOverrides?: TripperPriceOverrides | null;
  /** Tripper slug (curated journey) — forwarded to the type-picker carousel so it can gate cards by `allowedTypes`. */
  tripperSlug?: string;
}

export default function BudgetStep({
  accordionValue,
  allowedTypes,
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
  tripperPriceOverrides,
  tripperSlug,
}: BudgetStepProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleFallbackToGeneral() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tripper");
    const qs = params.toString();
    router.push(`/${locale}/journey${qs ? `?${qs}` : ""}`);
  }

  const hasTravelType = Boolean(travelerType);
  // Badge signal for TypePlanner/LevelCard — `undefined` means no tripper
  // context at all (direct journey, no badges); a defined (possibly empty)
  // list badges each level "BY TRIPPER {name}" or "BY RANDOMTRIP".
  const allowedLevelIds = allowedLevelsByType
    ? (allowedLevelsByType[travelerType as string] ?? [])
    : undefined;
  // Gate overrides by allowedTypes (when curated) rather than trusting
  // travelerType to already be an offered type — the type-picker filters its
  // own options to allowedTypes, but travelerType is read from the URL and
  // can reach this component via a stale/direct `?travelType=` param that
  // never went through that picker. Also gated per-level by allowedLevelIds
  // so a "BY RANDOMTRIP"-badged level never shows the tripper's price.
  const effectiveTripperPriceOverrides =
    hasTravelType && allowedTypes !== undefined
      ? getEffectiveTripperPriceOverrides(
          { allowedTypes, priceOverrides: tripperPriceOverrides ?? null },
          travelerType as TravelerTypeSlug,
          allowedLevelIds,
        )
      : tripperPriceOverrides;
  // Levels are never hidden — a level the tripper hasn't priced already
  // falls back to RandomTrip's base price inside `getPlannerContentForType`
  // (via `resolveBasePricePerPerson`), so every level for the selected type
  // stays bookable.
  const plannerContent = hasTravelType
    ? getPlannerContentForType(
        travelerType as TravelerTypeSlug,
        locale,
        effectiveTripperPriceOverrides,
      )
    : null;

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
          {(localizedTravelerTypes ?? []).length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-gray-500">{labels.noTripperExperiences}</p>
              <Button
                onClick={handleFallbackToGeneral}
                variant="outline"
                size="sm"
              >
                {labels.browseGeneralExperiences}
              </Button>
            </div>
          ) : (
            <TravelerTypesCarousel
              overflow="right"
              availableTypes={allowedTypes}
              localizedTravelerTypes={localizedTravelerTypes}
              onSelect={(slug) => {
                handleTravelTypeSelect(slug);
                onAccordionValueChange("travel-type");
              }}
              selectedTravelType={selectedTravelType}
              tripperBadge={tripperBadge}
              tripperSlug={tripperSlug}
              wrapped
            />
          )}
        </JourneyDropdown>

        <JourneyDropdown
          content={experienceContent}
          label={labels.experienceLabel}
          value="experience"
        >
          {hasTravelType &&
          plannerContent &&
          plannerContent.levels.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                {labels.experienceStepDescription}
              </p>
              <TypePlanner
                compact
                allowedLevelIds={allowedLevelIds}
                content={plannerContent}
                itemsPerView={2}
                minimizeAllFeatures={minimizeAllFeatures}
                onSelect={handleExperienceSelect}
                selectedLevel={selectedExperienceLevel}
                tripperBadge={tripperBadge}
                type={travelerType as TravelerTypeSlug}
                cardClassName="min-h-[450px]!"
              />
            </div>
          ) : hasTravelType &&
            plannerContent &&
            plannerContent.levels.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">{labels.noLevelsAvailable}</p>
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
