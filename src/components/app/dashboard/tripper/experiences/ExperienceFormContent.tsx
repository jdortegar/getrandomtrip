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
  /** Renders approve/reject actions in the form action area; suppresses the pending banner. */
  reviewActionsSlot?: ReactNode;
  isReadOnly?: boolean;
  isSubmitting: boolean;
  saveStatus: SaveStatus;
  onChange: ExperienceFormDraftOnChange;
  backHref?: string;
  onClearAll: () => void;
  onNext: () => void;
  onSubmit: () => void;
  openSectionId: string;
  onSectionChange: (id: string) => void;
  tabs: TripperExperiencesDict["form"]["contentTabs"];
  /** Fields changed by admin edit; when provided, highlights those field labels. */
  changedFields?: string[];
}


function resolveStepContent(
  activeTab: string,
  substepId: string,
  form: ExperienceFormDraft,
  onChange: ExperienceFormDraftOnChange,
  copy: TripperExperiencesDict["form"],
  imageState: ExperienceImageState,
  changedFieldSet?: Set<string>,
  isReadOnly?: boolean,
): React.ReactNode {
  if (activeTab === "about") {
    if (substepId === "experience")
      return (
        <AboutExperienceStep copy={copy} form={form} onChange={onChange} imageState={imageState} changedFieldSet={changedFieldSet} />
      );
    if (substepId === "destination")
      return (
        <AboutDestinationStep copy={copy} form={form} onChange={onChange} changedFieldSet={changedFieldSet} />
      );
  }
  if (activeTab === "logistics") {
    if (substepId === "accommodation")
      return (
        <LogisticsAccommodationStep copy={copy} form={form} onChange={onChange} changedFieldSet={changedFieldSet} />
      );
  }
  if (activeTab === "activities") {
    if (substepId === "activities-list")
      return <ActivitiesListStep copy={copy} form={form} onChange={onChange} imageState={imageState} changedFieldSet={changedFieldSet} isReadOnly={isReadOnly} />;
    if (substepId === "itinerary")
      return <ItineraryStep copy={copy} form={form} onChange={onChange} imageState={imageState} changedFieldSet={changedFieldSet} isReadOnly={isReadOnly} />;
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
  reviewActionsSlot,
  backHref,
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
  changedFields,
}: ExperienceFormContentProps) {
  // Build a Set for fast lookup of changed field names
  const changedFieldSet = changedFields && changedFields.length > 0
    ? new Set(changedFields)
    : null;
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
      {/* Changed-fields banner: shown in adminReadOnly mode when there are highlighted fields */}
      {changedFieldSet && changedFieldSet.size > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="mt-0.5 text-base leading-none">⚠</span>
          <div>
            <span className="font-semibold">{copy.changedFieldsBanner.prefix}</span>
            <span>{[...changedFieldSet].join(", ")}</span>
          </div>
        </div>
      )}
      <Accordion
        type="single"
        collapsible
        value={openSectionId}
        onValueChange={onSectionChange}
        className="flex flex-col gap-4"
      >
        {currentTab.substeps.map((substep) => (
          <JourneyDropdown key={substep.id} value={substep.id} label={substep.title}>
            {/* fieldset wraps only form content so accordion trigger stays clickable */}
            <fieldset disabled={isReadOnly} className="contents">
              {resolveStepContent(
                activeTab,
                substep.id,
                form,
                onChange,
                copy,
                imageState,
                changedFieldSet ?? undefined,
                isReadOnly,
              )}
            </fieldset>
          </JourneyDropdown>
        ))}
      </Accordion>

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
        reviewActionsSlot ? (
          !isLastTab ? (
            <JourneyActionBar
              canContinue
              isAllStepsComplete={false}
              isSavingAndRedirecting={false}
              labels={{ clearAll: "", next: copy.actionBar.next, viewCheckout: "" }}
              onClearAll={() => { /* read-only */ }}
              onContinue={onNext}
              onGoToCheckout={() => { /* read-only */ }}
              showClearAll={false}
            />
          ) : (
            reviewActionsSlot
          )
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="text-sm text-blue-800">
              <span className="font-medium">{copy.review.pendingTitle} — </span>
              {copy.review.pendingBody}
            </div>
          </div>
        )
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
            backHref={backHref}
            canContinue={canContinue}
            isAllStepsComplete={isLastTab && allTabsComplete}
            isSavingAndRedirecting={isSubmitting}
            labels={{
              back: copy.actionBar.back,
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
