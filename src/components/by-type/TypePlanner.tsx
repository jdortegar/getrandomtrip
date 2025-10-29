'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import { WizardHeader } from '@/components/WizardHeader';
import Budget from '@/components/by-type/shared/Budget';
import Excuse from '@/components/by-type/shared/Excuse';
import Details from '@/components/by-type/shared/Details';
import type { TypePlannerContent } from '@/types/planner';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface TypePlannerProps {
  content: TypePlannerContent;
  type: TravelerTypeSlug;
}

const WIZARD_STEPS = [
  { step: 1, label: 'Presupuesto' },
  { step: 2, label: 'La Excusa' },
  { step: 3, label: 'Details' },
];

export default function TypePlanner({ content, type }: TypePlannerProps) {
  const [step, setStep] = useState<number>(1);
  const [budgetLevel, setBudgetLevel] = useState<string | null>(null);
  const [excuseKey, setExcuseKey] = useState<string | null>(null);

  // Get selected level and excuse data
  const selectedLevel = useMemo(() => {
    if (!budgetLevel) return null;
    return content.levels.find((level) => level.id === budgetLevel);
  }, [budgetLevel, content.levels]);

  const selectedExcuse = useMemo(() => {
    if (!selectedLevel || !excuseKey) return null;
    return selectedLevel.excuses.find((excuse) => excuse.key === excuseKey);
  }, [selectedLevel, excuseKey]);

  // Validation function to check if previous steps have required data
  const canNavigateToStep = (targetStep: number): boolean => {
    switch (targetStep) {
      case 1:
        return true;
      case 2:
        return budgetLevel !== null;
      case 3:
        return budgetLevel !== null;
      default:
        return false;
    }
  };

  // Scroll to planner section when step changes
  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    setTimeout(() => {
      const plannerElement = document.getElementById(`${type}-planner`);
      if (plannerElement) {
        plannerElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  const renderActiveTab = () => {
    switch (step) {
      case 1:
        return (
          <Budget
            budgetLevel={budgetLevel}
            plannerId={`${type}-planner`}
            setBudgetLevel={setBudgetLevel}
            setStep={handleStepChange}
            levels={content.levels}
            type={type}
          />
        );
      case 2:
        return (
          <Excuse
            excuseCards={selectedLevel?.excuses || []}
            content={{
              title: '¿Qué los mueve a viajar?',
              tagline: 'Toda escapada tiene su "porque sí".',
            }}
            plannerId={`${type}-planner`}
            setExcuseKey={setExcuseKey}
            setStep={handleStepChange}
          />
        );
      case 3:
        return (
          <Details
            excuseKey={excuseKey}
            excuseOptions={
              selectedExcuse ? { [excuseKey!]: selectedExcuse.details } : {}
            }
            budgetLevel={budgetLevel}
            content={{
              title: 'Afina los detalles finales',
              tagline: 'Personaliza tu aventura con las opciones que prefieras',
              ctaLabel: 'Ver resumen del viaje →',
            }}
            setStep={handleStepChange}
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
          onStepClick={handleStepChange}
          steps={WIZARD_STEPS}
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
