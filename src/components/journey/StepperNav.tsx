'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/store';

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
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'es';
  const { type, level, basePriceUsd } = useStore();

  const goPrev = () => {
    if (currentStep === 1) {
      router.back();
      return;
    }
    onStepChange(currentStep - 1);
  };

  const isLastStep = currentStep === steps.length;

  const goNext = () => {
    // Check if current step is complete before allowing next
    if (isStepComplete(currentStep)) {
      if (isLastStep) {
        // Redirect to summary page on last step, preserving URL params
        const params = new URLSearchParams();
        params.set('type', type);
        params.set('level', level);
        if (basePriceUsd > 0) {
          params.set('pbp', basePriceUsd.toString());
        }
        router.push(`/${locale}/checkout?${params.toString()}`);
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
