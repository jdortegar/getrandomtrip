"use client";

import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { ExcusesCarousel } from "@/components/journey/ExcusesCarousel";
import { RefineDetailsCarousel } from "@/components/journey/RefineDetailsCarousel";
import { Button } from "@/components/ui/Button";
import type { ExcuseData } from "@/lib/data/shared/excuses";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

type LocalizedExcuse = {
  key: string;
  title: string;
  description: string;
};

type RefineDetailsOption = {
  key: string;
  label: string;
  desc: string;
  img: string;
};

export interface ExcuseStepLabels {
  completeBudgetFirst: string;
  customTripNoExcuseMessage: string;
  excuseCardCta: string;
  excuseLabel: string;
  excuseStepDescription: string;
  next: string;
  refineDetailsLabel: string;
  refineDetailsPlaceholder: string;
  refineDetailsStepDescription: string;
  clearAll: string;
}

export interface ExcuseStepProps {
  accordionValue: string;
  onAccordionValueChange: (next: string) => void;
  onTabChange?: (tabId: string) => void;

  travelType?: TravelerTypeSlug;
  experience?: string;
  excuse?: string;
  hasExcuseStep: boolean;

  excuses: ExcuseData[];
  localizedExcuses?: LocalizedExcuse[];
  onSelectExcuse: (excuseKey: string) => void;

  refineDetailsOptions: RefineDetailsOption[];
  refineDetails: string[];
  onSelectRefineDetails: (optionKey: string) => void;
  onClearRefineDetails: () => void;

  getExcuseLabel: string;
  getRefineDetailsLabel: string;
  labels: ExcuseStepLabels;
}

export default function ExcuseStep({
  accordionValue,
  onAccordionValueChange,
  onTabChange,
  travelType,
  experience,
  excuse,
  hasExcuseStep,
  excuses,
  localizedExcuses,
  onSelectExcuse,
  refineDetailsOptions,
  refineDetails,
  onSelectRefineDetails,
  onClearRefineDetails,
  getExcuseLabel,
  getRefineDetailsLabel,
  labels,
}: ExcuseStepProps) {
  const shouldShowNoExcuseMessage = Boolean(
    travelType && experience && !hasExcuseStep,
  );

  if (shouldShowNoExcuseMessage) {
    return (
      <div className="min-w-0 w-full">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-gray-600">{labels.refineDetailsStepDescription}</p>
          <p className="mt-2 text-sm text-gray-500">
            {labels.customTripNoExcuseMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <Accordion
        collapsible
        onValueChange={onAccordionValueChange}
        type="single"
        value={accordionValue}
      >
        <JourneyDropdown
          className="mb-4"
          content={getExcuseLabel}
          label={labels.excuseLabel}
          value="excuse"
        >
          {travelType && experience ? (
            <div className="space-y-4">
              <p className="text-gray-600">{labels.excuseStepDescription}</p>
              <ExcusesCarousel
                ctaLabel={labels.excuseCardCta}
                excuses={excuses}
                itemsPerView={3}
                localizedExcuses={localizedExcuses}
                onSelect={onSelectExcuse}
                selectedExcuse={excuse}
              />
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">{labels.completeBudgetFirst}</p>
            </div>
          )}
        </JourneyDropdown>

        {travelType && experience && excuse && (
          <JourneyDropdown
            className="mb-4"
            content={getRefineDetailsLabel}
            label={labels.refineDetailsLabel}
            value="refine-details"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                {labels.refineDetailsStepDescription}
              </p>

              {refineDetailsOptions.length > 0 ? (
                <>
                  <RefineDetailsCarousel
                    itemsPerView={3}
                    onSelect={onSelectRefineDetails}
                    options={refineDetailsOptions}
                    selectedOptions={refineDetails}
                  />
                  {/* <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <button
                      className="text-gray-500 text-sm font-medium underline hover:no-underline disabled:opacity-50"
                      onClick={onClearRefineDetails}
                      type="button"
                    >
                      {labels.clearAll}
                    </button>
                    <Button
                      className="text-sm font-normal normal-case"
                      onClick={() => {
                        if (onTabChange) onTabChange('details');
                        onAccordionValueChange('origin');
                      }}
                      size="md"
                      type="button"
                      variant="default"
                    >
                      {labels.next}
                    </Button>
                  </div> */}
                </>
              ) : (
                <p className="py-4 text-center text-gray-500">
                  {labels.refineDetailsPlaceholder}
                </p>
              )}
            </div>
          </JourneyDropdown>
        )}
      </Accordion>
    </div>
  );
}
