"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface JourneyActionBarLabels {
  back?: string;
  clearAll: string;
  next: string;
  saveDraft?: string;
  viewCheckout: string;
}

interface JourneyActionBarProps {
  backHref?: string;
  canContinue: boolean;
  /** Overrides the root's margin/padding classes — default fits the journey/XSED flows. */
  className?: string;
  isAllStepsComplete: boolean;
  isSavingAndRedirecting: boolean;
  isSavingDraft?: boolean;
  labels: JourneyActionBarLabels;
  /** Jumps back in-page (e.g. to step 1) instead of navigating away. Takes priority over backHref. */
  onBack?: () => void;
  onClearAll: () => void;
  onContinue: () => void;
  onGoToCheckout: () => void;
  onSaveDraft?: () => void;
  /** When false, hides Clear all (nothing to reset yet). */
  showClearAll: boolean;
}

export function JourneyActionBar({
  backHref,
  canContinue,
  className,
  isAllStepsComplete,
  isSavingAndRedirecting,
  isSavingDraft,
  labels,
  onBack,
  onClearAll,
  onContinue,
  onGoToCheckout,
  onSaveDraft,
  showClearAll,
}: JourneyActionBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 sm:gap-10 mt-8 pt-6 border-t border-gray-200",
        className,
      )}
    >
      {onBack && labels.back ? (
        <button
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
          onClick={onBack}
          type="button"
        >
          {labels.back}
        </button>
      ) : backHref && labels.back ? (
        <Link
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
          href={backHref}
        >
          {labels.back}
        </Link>
      ) : null}

      {showClearAll ? (
        <button
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
          onClick={onClearAll}
          type="button"
        >
          {labels.clearAll}
        </button>
      ) : null}

      {onSaveDraft && labels.saveDraft ? (
        <Button
          disabled={isSavingDraft || isSavingAndRedirecting}
          onClick={onSaveDraft}
          size="sm"
          variant="outline"
          type="button"
        >
          {isSavingDraft ? "Guardando..." : labels.saveDraft}
        </Button>
      ) : null}

      {!isAllStepsComplete && (
        <Button
          onClick={onContinue}
          size="sm"
          variant="default"
          disabled={!canContinue}
        >
          {labels.next}
        </Button>
      )}

      {isAllStepsComplete && (
        <Button
          disabled={isSavingAndRedirecting}
          onClick={onGoToCheckout}
          size="sm"
          variant="default"
        >
          {isSavingAndRedirecting ? "Guardando..." : labels.viewCheckout}
        </Button>
      )}
    </div>
  );
}
