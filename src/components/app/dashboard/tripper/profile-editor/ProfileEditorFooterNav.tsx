"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileStepId } from "@/types/tripper";

interface ProfileEditorFooterNavProps {
  activeStep: TripperProfileStepId;
  copy: TripperProfileEditorDict["footer"];
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  stepIndex: number;
  totalSteps: number;
}

/** Previous / "n of 6" / next-step CTA row below the active step. */
export function ProfileEditorFooterNav({
  activeStep,
  copy,
  isLastStep,
  onNext,
  onPrevious,
  stepIndex,
  totalSteps,
}: ProfileEditorFooterNavProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-2" data-component="ProfileEditorFooterNav">
      <Button
        className="shrink-0 text-ink"
        disabled={stepIndex === 0}
        onClick={onPrevious}
        type="button"
        variant="ghost"
      >
        <ArrowLeft aria-hidden />
        {copy.previous}
      </Button>
      <span className="hidden text-xs text-neutral-500 sm:inline">
        {interpolateTemplate(copy.stepOf, {
          current: String(stepIndex + 1),
          total: String(totalSteps),
        })}
      </span>
      <Button
        className={cn("min-w-0 shrink text-balance", "sm:shrink-0")}
        onClick={onNext}
        size="md"
        type="button"
      >
        {copy.next[activeStep]}
        {isLastStep ? null : <ArrowRight aria-hidden />}
      </Button>
    </div>
  );
}
