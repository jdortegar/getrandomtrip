"use client";

import { Button } from "@/components/ui/Button";

interface JourneyActionBarLabels {
  clearAll: string;
  next: string;
  viewCheckout: string;
}

interface JourneyActionBarProps {
  canContinue: boolean;
  isAllStepsComplete: boolean;
  isSavingAndRedirecting: boolean;
  labels: JourneyActionBarLabels;
  onClearAll: () => void;
  onContinue: () => void;
  onGoToCheckout: () => void;
  /** When false, hides Clear all (nothing to reset yet). */
  showClearAll: boolean;
}

export function JourneyActionBar({
  canContinue,
  isAllStepsComplete,
  isSavingAndRedirecting,
  labels,
  onClearAll,
  onContinue,
  onGoToCheckout,
  showClearAll,
}: JourneyActionBarProps) {
  return (
    <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-gray-200">
      {showClearAll ? (
        <button
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
          onClick={onClearAll}
          type="button"
        >
          {labels.clearAll}
        </button>
      ) : null}

      {canContinue && (
        <Button onClick={onContinue} size="sm" variant="default">
          {labels.next}
        </Button>
      )}

      {isAllStepsComplete && !canContinue && (
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
