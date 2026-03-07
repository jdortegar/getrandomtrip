import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  return (
    <div
      aria-valuemax={totalSteps}
      aria-valuemin={1}
      aria-valuenow={currentStep}
      className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
