'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import { WizardHeader } from '@/components/WizardHeader';
import Presupuesto from '@/components/by-type/shared/Presupuesto';
import Excuse from '@/components/by-type/shared/Excuse';
import Details from '@/components/by-type/shared/Details';
import type { TypePlannerContent } from '@/types/planner';
import { ALL_LEVELS } from '@/content/levels';
import type { LevelContent } from '@/content/levels';

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

  // Generate tiers dynamically from ALL_LEVELS
  const tiers = useMemo(() => {
    const selectedLevels = ALL_LEVELS[type as keyof typeof ALL_LEVELS];

    if (!selectedLevels) return content.tiers; // Fallback to content tiers

    // For honeymoon, only show the atelier level
    const levelsToShow =
      type === 'honeymoon'
        ? { atelier: selectedLevels.atelier }
        : selectedLevels;

    return Object.entries(levelsToShow).map(([key, levelContent]) => {
      const level = levelContent as LevelContent;

      return {
        id: key,
        name: level.title,
        subtitle: level.subtitle,
        priceLabel: level.priceLabel,
        priceFootnote: level.priceFootnote,
        // Map new features structure to format expected by Presupuesto
        features: level.features.map((feature) => ({
          label: feature.label,
          text: `${feature.label}: ${feature.content}`,
        })),
        closingLine: level.closingLine,
        ctaLabel: level.ctaLabel,
      };
    });
  }, [type, content.tiers]);

  const steps = [
    { step: 1, label: 'Budget' },
    { step: 2, label: content.steps.step2Label },
    { step: 3, label: 'Details' },
  ];

  // Validation function to check if previous steps have required data
  const canNavigateToStep = (targetStep: number): boolean => {
    switch (targetStep) {
      case 1:
        return true; // First step is always accessible
      case 2:
        return budgetTier !== null; // Need budget tier to access step 2
      case 3:
        return budgetTier !== null; // Only need budget tier to access step 3 (almaKey is optional)
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
            setStep={handleStepChange}
            tiers={tiers}
            type={type}
          />
        );
      case 2:
        return (
          <Excuse
            almaCards={content.steps.excuse.cards}
            content={content.steps.excuse}
            plannerId={`${type}-planner`}
            setAlmaKey={setAlmaKey}
            setStep={handleStepChange}
          />
        );
      case 3:
        return (
          <Details
            almaKey={almaKey}
            almaOptions={content.almaOptions}
            budgetTier={budgetTier}
            content={content.steps.details}
            pendingPriceLabel={pendingPriceLabel}
            setStep={handleStepChange}
            type={type}
          />
        );
    }

    return null;
  };

  // Scroll to planner section when step changes
  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    // Scroll to the planner section after a short delay to allow for animation
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
