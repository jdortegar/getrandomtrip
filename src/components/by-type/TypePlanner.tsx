'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import { WizardHeader } from '@/components/WizardHeader';
import Presupuesto from '@/components/by-type/shared/Presupuesto';
import LaExcusa from '@/components/by-type/shared/LaExcusa';
import AfinarDetalles from '@/components/by-type/shared/AfinarDetalles';
import type { TypePlannerContent } from '@/types/planner';

interface TypePlannerProps {
  content: TypePlannerContent;
  type: string; // 'couple', 'solo', 'family', etc.
}

export default function TypePlanner({ content, type }: TypePlannerProps) {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(
    null,
  );
  const [almaKey, setAlmaKey] = useState<string | null>(null);

  const steps = [
    { step: 1, label: 'Presupuesto' },
    { step: 2, label: content.steps.step2Label },
    { step: 3, label: 'Detalles' },
  ];

  // Validation function to check if previous steps have required data
  const canNavigateToStep = (targetStep: number): boolean => {
    switch (targetStep) {
      case 1:
        return true; // First step is always accessible
      case 2:
        return budgetTier !== null; // Need budget tier to access step 2
      case 3:
        return budgetTier !== null && almaKey !== null; // Need both budget and alma for step 3
      default:
        return false;
    }
  };

  const renderActiveTab = () => {
    switch (step) {
      case 1:
        return (
          <Presupuesto
            budgetTier={budgetTier}
            content={content.steps.presupuesto}
            plannerId={`${type}-planner`}
            setBudgetTier={setBudgetTier}
            setPendingPriceLabel={setPendingPriceLabel}
            setStep={setStep}
            tiers={content.tiers}
            type={type}
          />
        );
      case 2:
        return (
          <LaExcusa
            almaCards={content.steps.laExcusa.cards}
            content={content.steps.laExcusa}
            plannerId={`${type}-planner`}
            setAlmaKey={setAlmaKey}
            setStep={setStep}
          />
        );
      case 3:
        return (
          <AfinarDetalles
            almaKey={almaKey}
            almaOptions={content.almaOptions}
            budgetTier={budgetTier}
            content={content.steps.afinarDetalles}
            pendingPriceLabel={pendingPriceLabel}
            setStep={setStep}
            type={type}
          />
        );
    }

    return null;
  };

  return (
    <Section
      className="py-20"
      fullWidth={true}
      subtitle={content.subtitle}
      title={content.title}
    >
      <div className="relative">
        <div id={`${type}-planner`} className="h-0 scroll-mt-24" />
        <WizardHeader
          canNavigateToStep={canNavigateToStep}
          currentStep={step}
          onStepClick={setStep}
          steps={steps}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            initial={{ opacity: 0, y: 20, height: 0 }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
              height: { duration: 0.4, ease: 'easeInOut' },
            }}
            className="w-full overflow-hidden min-h-[300px]"
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
