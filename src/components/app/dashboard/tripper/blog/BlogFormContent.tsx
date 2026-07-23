"use client";

import { useState } from "react";
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
import { resolveBlogFieldPeek, resolveBlogEntryPeek } from "@/lib/blog/blog-form-peek";
import type { FieldPeek } from "@/components/ui/field-peek";
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
  /** Disables all inputs — set by NewBlogPostShell when mode === 'adminReadOnly'. */
  readOnly?: boolean;
  /** When present, replaces the footer Back/Next/Finish nav (adminEdit/adminReadOnly). */
  reviewActionsSlot?: React.ReactNode;
  /** Fields (server column names) changed by the admin's proposed copy; when provided, highlights those field labels. */
  changedFields?: string[];
  /** Tripper's pristine original draft; enables the per-field peek toggle in `adminReadOnly` mode. */
  originalDraft?: BlogFormDraft;
}

function resolveStepContent(
  activeTab: string,
  substepId: string,
  copy: TripperBlogFormDict,
  draft: BlogFormDraft,
  onChange: BlogFormDraftOnChange,
  imageState: BlogImageState,
  changedFieldSet?: Set<string>,
  makePeek?: (field: keyof BlogFormDraft, diffKey?: string) => FieldPeek | undefined,
  makeSectionPeek?: (index: number, entryKey: "title" | "description") => FieldPeek | undefined,
  makeFaqPeek?: (index: number, entryKey: "question" | "answer") => FieldPeek | undefined,
): React.ReactNode {
  if (activeTab === "general") {
    if (substepId === "title-image") {
      return (
        <TitleImageStep
          copy={copy}
          draft={draft}
          onChange={onChange}
          imageState={imageState}
          changedFieldSet={changedFieldSet}
          peek={makePeek}
        />
      );
    }
    if (substepId === "feature-quote") {
      return (
        <FeatureQuoteStep
          copy={copy}
          draft={draft}
          onChange={onChange}
          changedFieldSet={changedFieldSet}
          peek={makePeek}
        />
      );
    }
  }
  if (activeTab === "content" && substepId === "sections") {
    return (
      <SectionsStep
        copy={copy}
        draft={draft}
        onChange={onChange}
        changedFieldSet={changedFieldSet}
        peek={makeSectionPeek}
      />
    );
  }
  if (activeTab === "faq" && substepId === "faq") {
    return (
      <FaqStep
        copy={copy}
        draft={draft}
        onChange={onChange}
        changedFieldSet={changedFieldSet}
        peek={makeFaqPeek}
      />
    );
  }
  if (activeTab === "gallery" && substepId === "gallery") {
    return (
      <GalleryStep
        copy={copy}
        draft={draft}
        onChange={onChange}
        imageState={imageState}
        changedFieldSet={changedFieldSet}
      />
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
  readOnly = false,
  reviewActionsSlot,
  changedFields,
  originalDraft,
}: BlogFormContentProps) {
  // Build a Set for fast lookup of changed field names
  const changedFieldSet = changedFields && changedFields.length > 0
    ? new Set(changedFields)
    : null;

  // Per-field "peek at original" toggle state — display-only, never mutates `draft`.
  const [peekedFields, setPeekedFields] = useState<Set<string>>(new Set());
  const togglePeek = (field: string) => {
    setPeekedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };
  const peekDictCopy = {
    peekShowOriginal: copy.changedFieldsBanner.peekShowOriginal,
    peekShowSuggestion: copy.changedFieldsBanner.peekShowSuggestion,
    noContent: copy.changedFieldsBanner.noContent,
  };
  const makePeek = (
    field: keyof BlogFormDraft,
    diffKey?: string,
  ): FieldPeek | undefined =>
    resolveBlogFieldPeek({
      field,
      diffKey,
      changedFieldSet,
      originalDraft,
      peekedFields,
      onToggle: () => togglePeek(field),
      copy: peekDictCopy,
    });
  const makeSectionPeek = (
    index: number,
    entryKey: "title" | "description",
  ): FieldPeek | undefined => {
    const peekKey = `sections.${index}.${entryKey}`;
    return resolveBlogEntryPeek({
      diffKey: "blocks",
      changedFieldSet,
      originalEntry: originalDraft?.sections[index],
      entryKey,
      currentValue: draft.sections[index]?.[entryKey] ?? "",
      peekKey,
      peekedFields,
      onToggle: () => togglePeek(peekKey),
      copy: peekDictCopy,
    });
  };
  const makeFaqPeek = (
    index: number,
    entryKey: "question" | "answer",
  ): FieldPeek | undefined => {
    const peekKey = `faq.${index}.${entryKey}`;
    return resolveBlogEntryPeek({
      diffKey: "faq",
      changedFieldSet,
      originalEntry: originalDraft?.faq[index],
      entryKey,
      currentValue: draft.faq[index]?.[entryKey] ?? "",
      peekKey,
      peekedFields,
      onToggle: () => togglePeek(peekKey),
      copy: peekDictCopy,
    });
  };

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
            {/* fieldset wraps only form content so accordion trigger stays clickable */}
            <fieldset disabled={readOnly} className="contents">
              {resolveStepContent(
                activeTab,
                substep.id,
                copy,
                draft,
                onChange,
                imageState,
                changedFieldSet ?? undefined,
                makePeek,
                makeSectionPeek,
                makeFaqPeek,
              )}
            </fieldset>
          </JourneyDropdown>
        ))}
      </Accordion>

      {missingFields.length > 0 && !readOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">{copy.requiredFieldsLabel}: </span>
            {missingFields.join(", ")}
          </div>
        </div>
      )}

      {readOnly ? (
        // Approve/reject/edit now live in the sticky `BlogReviewActionsBar`
        // (NewBlogPostShell), always reachable regardless of tab. Still need
        // Next/Back to step through tabs while read-only — force
        // isAllStepsComplete false so JourneyActionBar never swaps to the
        // "Submit for review" button, and hide Clear all (nothing to reset).
        reviewActionsSlot ? (
          <JourneyActionBar
            onBack={onPreviousStep}
            canContinue
            isAllStepsComplete={false}
            isSavingAndRedirecting={false}
            labels={{
              back: copy.actionBar.back,
              clearAll: copy.actionBar.clearAll,
              next: copy.actionBar.next,
              viewCheckout: copy.actionBar.submitForReview,
            }}
            onClearAll={() => {}}
            onContinue={onNext}
            onGoToCheckout={() => {}}
            showClearAll={false}
          />
        ) : (
          // Tripper viewing their own PENDING_REVIEW post directly (not via
          // the review-copy page) — no actions to take, just an explanation.
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
            onBack={onPreviousStep}
            canContinue={canContinue}
            // Editable-but-not-tripper (adminEdit): reviewActionsSlot is present, but the
            // real submit action lives in the sticky bar (Send to Tripper), not here — force
            // "Next" so this button never turns into a "Submit for review" dead end.
            isAllStepsComplete={!reviewActionsSlot && isLastTab && allTabsComplete}
            isSavingAndRedirecting={isFinishing}
            labels={{
              back: copy.actionBar.back,
              clearAll: copy.actionBar.clearAll,
              next: copy.actionBar.next,
              viewCheckout: copy.actionBar.submitForReview,
            }}
            onClearAll={onClearAll}
            onContinue={onNext}
            onGoToCheckout={onFinish}
            showClearAll={hasValues}
          />
        </div>
      )}
    </div>
  );
}
