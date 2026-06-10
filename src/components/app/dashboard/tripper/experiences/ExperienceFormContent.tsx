"use client";

import type React from "react";
import type { ReactNode } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import { AboutExperienceStep } from "./steps/AboutExperienceStep";
import { AboutDestinationStep } from "./steps/AboutDestinationStep";
import { LogisticsAccommodationStep } from "./steps/LogisticsAccommodationStep";
import { ActivitiesListStep } from "./steps/ActivitiesListStep";
import { ItineraryStep } from "./steps/ItineraryStep";
import { TagsMediaStep } from "./steps/TagsMediaStep";
import { VisibilityStep } from "./steps/VisibilityStep";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";
import {
  getMissingFields,
  isExperienceTabComplete,
} from "@/lib/helpers/experience-form";
import type { SaveStatus, ExperienceImageState } from "./NewExperienceShell";

interface ExperienceFormContentProps {
  activeTab: string;
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  imageState: ExperienceImageState;
  adminReviewSlot?: ReactNode;
  isReadOnly?: boolean;
  isSubmitting: boolean;
  saveStatus: SaveStatus;
  onChange: ExperienceFormDraftOnChange;
  onClearAll: () => void;
  onNext: () => void;
  onSubmit: () => void;
  openSectionId: string;
  onSectionChange: (id: string) => void;
  tabs: TripperExperiencesDict["form"]["contentTabs"];
}

function resolveStepContent(
  activeTab: string,
  substepId: string,
  form: ExperienceFormDraft,
  onChange: ExperienceFormDraftOnChange,
  copy: TripperExperiencesDict["form"],
  imageState: ExperienceImageState,
): React.ReactNode {
  if (activeTab === "about") {
    if (substepId === "experience")
      return (
        <AboutExperienceStep copy={copy} form={form} onChange={onChange} />
      );
    if (substepId === "destination")
      return (
        <AboutDestinationStep copy={copy} form={form} onChange={onChange} />
      );
  }
  if (activeTab === "logistics") {
    if (substepId === "accommodation")
      return (
        <LogisticsAccommodationStep
          copy={copy}
          form={form}
          onChange={onChange}
        />
      );
  }
  if (activeTab === "activities") {
    if (substepId === "activities-list")
      return <ActivitiesListStep copy={copy} form={form} onChange={onChange} />;
    if (substepId === "itinerary")
      return <ItineraryStep copy={copy} form={form} onChange={onChange} />;
  }
  if (activeTab === "media") {
    if (substepId === "tags")
      return (
        <TagsMediaStep
          copy={copy}
          form={form}
          onChange={onChange}
          imageState={imageState}
        />
      );
    if (substepId === "visibility")
      return <VisibilityStep copy={copy} form={form} onChange={onChange} />;
  }
  return null;
}

function SaveIndicator({
  status,
  labels,
}: {
  status: SaveStatus;
  labels: { saving: string; saved: string; error: string };
}) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3 text-green-500" />}
      {status === "error" && <AlertCircle className="h-3 w-3 text-red-400" />}
      <span>
        {status === "saving" && labels.saving}
        {status === "saved" && labels.saved}
        {status === "error" && labels.error}
      </span>
    </div>
  );
}

export function ExperienceFormContent({
  activeTab,
  adminReviewSlot,
  copy,
  form,
  imageState,
  isReadOnly = false,
  isSubmitting,
  saveStatus,
  onChange,
  onClearAll,
  onNext,
  onSubmit,
  openSectionId,
  onSectionChange,
  tabs,
}: ExperienceFormContentProps) {
  if (activeTab === "admin-review" && adminReviewSlot) {
    return <>{adminReviewSlot}</>;
  }

  const currentTab = tabs.find((t) => t.id === activeTab);
  if (!currentTab) return null;

  const isLastTab = tabs[tabs.length - 1]?.id === activeTab;
  const hasValues = !!(form.title || form.teaser || form.description);
  const canContinue = isExperienceTabComplete(activeTab, form);
  const allTabsComplete = tabs
    .filter((t) => t.id !== "admin-review")
    .every((t) => isExperienceTabComplete(t.id, form));
  const missingFields = canContinue
    ? []
    : getMissingFields(activeTab, form, copy.fields as Record<string, string>);

  return (
    <div className="flex flex-col gap-4">
      {/* Wrap in fieldset to natively disable all descendant form controls when read-only.
          className="contents" preserves layout without adding a box. */}
      <fieldset disabled={isReadOnly} className="contents">
        <Accordion
          type="single"
          collapsible
          value={openSectionId}
          onValueChange={onSectionChange}
          className="flex flex-col gap-4"
        >
          {currentTab.substeps.map((substep, i) => (
            <JourneyDropdown
              key={substep.id}
              value={substep.id}
              label={substep.title}
            >
              {resolveStepContent(
                activeTab,
                substep.id,
                form,
                onChange,
                copy,
                imageState,
              )}
            </JourneyDropdown>
          ))}
        </Accordion>
      </fieldset>

      {missingFields.length > 0 && !isReadOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">{copy.requiredFieldsLabel}: </span>
            {missingFields.join(", ")}
          </div>
        </div>
      )}

      {isReadOnly ? (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="text-sm text-blue-800">
            <span className="font-medium">{copy.review.pendingTitle} — </span>
            {copy.review.pendingBody}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-0 bottom-3">
            <SaveIndicator
              status={saveStatus}
              labels={{
                saving: copy.saving,
                saved: copy.saved,
                error: copy.errorSave,
              }}
            />
          </div>

          <JourneyActionBar
            canContinue={canContinue}
            isAllStepsComplete={isLastTab && allTabsComplete}
            isSavingAndRedirecting={isSubmitting}
            labels={{
              clearAll: copy.actionBar.clearAll,
              next: copy.actionBar.next,
              viewCheckout: copy.actionBar.submitForReview,
            }}
            onClearAll={onClearAll}
            onContinue={onNext}
            onGoToCheckout={onSubmit}
            showClearAll={hasValues}
          />
        </div>
      )}
    </div>
  );
}
