"use client";

import type React from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import { TitleImageStep } from "./steps/TitleImageStep";
import { FeatureQuoteStep } from "./steps/FeatureQuoteStep";
import { SectionsStep } from "./steps/SectionsStep";
import { FaqStep } from "./steps/FaqStep";
import { GalleryStep } from "./steps/GalleryStep";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";
import { getMissingBlogFields, isBlogTabComplete } from "@/lib/helpers/blog-form";
import type { BlogImageState, SaveStatus } from "./NewBlogPostShell";

interface BlogFormContentProps {
  activeTab: string;
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  imageState: BlogImageState;
  isFinishing: boolean;
  saveStatus: SaveStatus;
  onChange: BlogFormDraftOnChange;
  onClearAll: () => void;
  onNext: () => void;
  onPreviousStep: () => void;
  onFinish: () => void;
  openSectionId: string;
  onSectionChange: (id: string) => void;
  tabs: TripperBlogFormDict["contentTabs"];
}

function resolveStepContent(
  activeTab: string,
  substepId: string,
  copy: TripperBlogFormDict,
  draft: BlogFormDraft,
  onChange: BlogFormDraftOnChange,
  imageState: BlogImageState,
): React.ReactNode {
  if (activeTab === "general") {
    if (substepId === "title-image") {
      return (
        <TitleImageStep copy={copy} draft={draft} onChange={onChange} imageState={imageState} />
      );
    }
    if (substepId === "feature-quote") {
      return <FeatureQuoteStep copy={copy} draft={draft} onChange={onChange} />;
    }
  }
  if (activeTab === "content" && substepId === "sections") {
    return <SectionsStep copy={copy} draft={draft} onChange={onChange} />;
  }
  if (activeTab === "faq" && substepId === "faq") {
    return <FaqStep copy={copy} draft={draft} onChange={onChange} />;
  }
  if (activeTab === "gallery" && substepId === "gallery") {
    return (
      <GalleryStep copy={copy} draft={draft} onChange={onChange} imageState={imageState} />
    );
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

export function BlogFormContent({
  activeTab,
  copy,
  draft,
  imageState,
  isFinishing,
  saveStatus,
  onChange,
  onClearAll,
  onNext,
  onPreviousStep,
  onFinish,
  openSectionId,
  onSectionChange,
  tabs,
}: BlogFormContentProps) {
  const currentTab = tabs.find((t) => t.id === activeTab);
  if (!currentTab) return null;

  const isLastTab = tabs[tabs.length - 1]?.id === activeTab;
  const hasValues = !!(draft.title || draft.subtitle || draft.coverUrl);
  const canContinue = isBlogTabComplete(activeTab, draft);
  const allTabsComplete = tabs.every((t) => isBlogTabComplete(t.id, draft));
  const missingFields = canContinue
    ? []
    : getMissingBlogFields(activeTab, draft, copy.fields as Record<string, string>);

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        type="single"
        collapsible
        value={openSectionId}
        onValueChange={onSectionChange}
        className="flex flex-col gap-4"
      >
        {currentTab.substeps.map((substep) => (
          <JourneyDropdown key={substep.id} value={substep.id} label={substep.title}>
            {resolveStepContent(activeTab, substep.id, copy, draft, onChange, imageState)}
          </JourneyDropdown>
        ))}
      </Accordion>

      {missingFields.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">{copy.requiredFieldsLabel}: </span>
            {missingFields.join(", ")}
          </div>
        </div>
      )}

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
          onBack={onPreviousStep}
          canContinue={canContinue}
          isAllStepsComplete={isLastTab && allTabsComplete}
          isSavingAndRedirecting={isFinishing}
          labels={{
            back: copy.actionBar.back,
            clearAll: copy.actionBar.clearAll,
            next: copy.actionBar.next,
            viewCheckout: copy.actionBar.finish,
          }}
          onClearAll={onClearAll}
          onContinue={onNext}
          onGoToCheckout={onFinish}
          showClearAll={hasValues}
        />
      </div>
    </div>
  );
}
