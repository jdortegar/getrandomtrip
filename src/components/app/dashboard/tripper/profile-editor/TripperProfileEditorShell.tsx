"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ProfileEditorAside } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorAside";
import { ProfileEditorFooterNav } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorFooterNav";
import { ProfileEditorHeader } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorHeader";
import {
  ProfileEditorStatusBar,
  type ProfileSaveState,
} from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorStatusBar";
import { ProfileEditorStepHeader } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorStepHeader";
import { ProfileEditorStepNav } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorStepNav";
import { ProfileEditorSubmitModal } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorSubmitModal";
import { TripperProfileEditorStep } from "@/components/app/dashboard/tripper/profile-editor/TripperProfileEditorStep";
import { useProfileFileIntake, type ProfileFileKind } from "@/hooks/useProfileFileIntake";
import {
  TRIPPER_PROFILE_STEPS,
  canSubmitTripperProfile,
  getTripperProfileProgress,
} from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type {
  TripperProfileDraft,
  TripperProfileStatus,
  TripperProfileStepId,
  TripperProfileStoryOption,
} from "@/types/tripper";

interface TripperProfileEditorShellProps {
  blogHref: string;
  copy: TripperProfileEditorDict;
  initialDraft: TripperProfileDraft;
  initialStatus: TripperProfileStatus;
  locale: string;
  /** Persists the draft. Without it, saving only marks the in-memory draft as saved. */
  onSaveDraft?: (draft: TripperProfileDraft) => Promise<void>;
  /** Sends an immutable copy for admin review. Without it, only the local status changes. */
  onSubmitForReview?: (draft: TripperProfileDraft) => Promise<void>;
  /** Public profile URL opened by "Preview"; null when the Tripper has no public link yet. */
  previewHref: string | null;
  /** The Tripper's own published blog posts (step 06 and atlas story links). */
  stories: TripperProfileStoryOption[];
  /** Stores a file and returns its URL. Defaults to local previews. */
  uploadFile?: (file: File, kind: ProfileFileKind) => Promise<string>;
}

export function TripperProfileEditorShell({
  blogHref,
  copy,
  initialDraft,
  initialStatus,
  locale,
  onSaveDraft,
  onSubmitForReview,
  previewHref,
  stories,
  uploadFile,
}: TripperProfileEditorShellProps) {
  const [draft, setDraft] = useState<TripperProfileDraft>(initialDraft);
  const [status, setStatus] = useState<TripperProfileStatus>(initialStatus);
  const [activeStep, setActiveStep] = useState<TripperProfileStepId>("identity");
  const [saveState, setSaveState] = useState<ProfileSaveState>("clean");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const stepIndex = TRIPPER_PROFILE_STEPS.findIndex((step) => step.id === activeStep);
  const activeMeta = TRIPPER_PROFILE_STEPS[stepIndex]!;
  const isLastStep = stepIndex === TRIPPER_PROFILE_STEPS.length - 1;

  const progress = useMemo(() => getTripperProfileProgress(draft), [draft]);
  const canSubmit = useMemo(() => canSubmitTripperProfile(draft), [draft]);

  const intakeFile = useProfileFileIntake(copy.toasts, uploadFile);
  const mainRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (saveState !== "dirty") return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  useEffect(() => {
    if (!hasNavigatedRef.current) return;
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeStep]);

  function updateDraft(updater: (current: TripperProfileDraft) => TripperProfileDraft) {
    setDraft(updater);
    setSaveState("dirty");
  }

  function goToStep(step: TripperProfileStepId) {
    hasNavigatedRef.current = true;
    setActiveStep(step);
  }

  function handleNext() {
    if (!isLastStep) {
      goToStep(TRIPPER_PROFILE_STEPS[stepIndex + 1]!.id);
      return;
    }
    if (canSubmit) {
      setIsSubmitOpen(true);
      return;
    }
    const firstIncomplete = progress.find((step) => step.essential && !step.complete);
    if (firstIncomplete) goToStep(firstIncomplete.id);
  }

  function handlePreview() {
    if (!previewHref) {
      toast.info(copy.header.previewUnavailable);
      return;
    }
    window.open(previewHref, "_blank", "noopener,noreferrer");
  }

  async function handleSave() {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      await onSaveDraft?.(draft);
      setSavedAt(new Date());
      setSaveState("saved");
      toast.success(copy.toasts.draftSaved);
    } catch {
      setSaveState("dirty");
      toast.error(copy.toasts.saveFailed);
    }
  }

  async function handleSubmit() {
    try {
      await onSubmitForReview?.(draft);
      setStatus("PENDING_REVIEW");
      setIsSubmitOpen(false);
      toast.success(copy.toasts.submitted);
    } catch {
      toast.error(copy.toasts.submitFailed);
    }
  }

  return (
    <div className="rt-container flex flex-col gap-8 py-8 text-left sm:py-10" data-component="TripperProfileEditorShell">
      <ProfileEditorHeader
        canSubmit={canSubmit}
        copy={copy.header}
        onPreview={handlePreview}
        onSubmit={() => setIsSubmitOpen(true)}
      />
      <ProfileEditorStatusBar
        copy={copy.status}
        locale={locale}
        onSave={() => void handleSave()}
        saveState={saveState}
        savedAt={savedAt}
        status={status}
      />

      <div
        className={cn(
          "grid grid-cols-1 gap-8",
          "lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_260px] xl:gap-10",
        )}
      >
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ProfileEditorStepNav activeStep={activeStep} copy={copy.nav} onSelect={goToStep} progress={progress} />
        </div>

        <div className="flex min-w-0 scroll-mt-24 flex-col gap-6" ref={mainRef}>
          <ProfileEditorStepHeader
            badge={activeMeta.essential ? copy.stepBadges.essential : copy.stepBadges.optional}
            eyebrow={copy[activeStep].eyebrow}
            lead={copy[activeStep].lead}
            title={copy[activeStep].title}
          />
          <TripperProfileEditorStep
            blogHref={blogHref}
            copy={copy}
            draft={draft}
            intakeFile={intakeFile}
            locale={locale}
            onPreview={handlePreview}
            step={activeStep}
            stories={stories}
            updateDraft={updateDraft}
          />
          <ProfileEditorFooterNav
            activeStep={activeStep}
            copy={copy.footer}
            isLastStep={isLastStep}
            onNext={handleNext}
            onPrevious={() => goToStep(TRIPPER_PROFILE_STEPS[Math.max(0, stepIndex - 1)]!.id)}
            stepIndex={stepIndex}
            totalSteps={TRIPPER_PROFILE_STEPS.length}
          />
        </div>

        <div className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
          <ProfileEditorAside activeStep={activeStep} copy={copy.aside} />
        </div>
      </div>

      <ProfileEditorSubmitModal
        copy={copy.submitModal}
        onConfirm={handleSubmit}
        onOpenChange={setIsSubmitOpen}
        open={isSubmitOpen}
      />
    </div>
  );
}
