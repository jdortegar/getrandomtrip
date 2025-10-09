'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface StepperNavProps {
  steps: Array<{ step: number; label: string }>;
  currentStep: number;
  isStepComplete: (stepNumber: number) => boolean;
  onStepChange: (step: number) => void;
}

export default function StepperNav({
  steps,
  currentStep,
  isStepComplete,
  onStepChange,
}: StepperNavProps) {
  const router = useRouter();

  const goPrev = () => {
    if (currentStep === 0) {
      return;
    }
    onStepChange(currentStep - 1);
  };

  const isLastStep = currentStep === steps.length;

  const goNext = () => {
    // Check if current step is complete before allowing next
    if (isStepComplete(currentStep)) {
      if (isLastStep) {
        // Redirect to summary page on last step
        router.push('/journey/summary');
      } else {
        onStepChange(currentStep + 1);
      }
    }
  };

  const nextLabel = isLastStep ? 'Revisar' : 'Continuar';
  const prevLabel = 'Volver';

  const canGoNext = isStepComplete(currentStep);

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button type="button" onClick={goPrev} variant="secondary">
        {prevLabel}
      </Button>
      <Button
        type="button"
        onClick={goNext}
        disabled={!canGoNext}
        className={!canGoNext ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
