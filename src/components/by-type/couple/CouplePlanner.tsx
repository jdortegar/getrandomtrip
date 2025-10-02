'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Presupuesto from '@/components/by-type/couple/Presupuesto';
import LaExcusa from '@/components/by-type/couple/LaExcusa';
import AfinarDetalles from '@/components/by-type/couple/AfinarDetalles';
import Section from '@/components/layout/Section';
import { WizardHeader } from '@/components/WizardHeader';

export default function CouplePlanner() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(
    null,
  );
  const [coupleAlma, setCoupleAlma] = useState<string | null>(null);

  // useEffect(() => {
  //   if (typeof window === 'undefined') return;
  //   const h = window.location.hash;
  //   const [, query] = h.split('?');
  //   const s = new URLSearchParams(query || '').get('step');
  //   if (s === 'budget') setStep('Presupuesto');
  // }, []);
  const steps = [
    { step: 1, label: 'Presupuesto' },
    { step: 2, label: 'La Excusa' },
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
        return budgetTier !== null && coupleAlma !== null; // Need both budget and couple alma for step 3
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
            setBudgetTier={setBudgetTier}
            setPendingPriceLabel={setPendingPriceLabel}
            setStep={setStep}
          />
        );
      case 2:
        return <LaExcusa setCoupleAlma={setCoupleAlma} setStep={setStep} />;
      case 3:
        return (
          <AfinarDetalles
            coupleAlma={coupleAlma}
            budgetTier={budgetTier}
            pendingPriceLabel={pendingPriceLabel}
            setStep={setStep}
          />
        );
    }

    return null;
  };

  return (
    <Section
      title="Diseñen su Randomtrip en pareja"
      subtitle="Tres pasos sencillos para vivir una historia que nadie más podrá contar."
    >
      <div className="relative">
        <div id="couple-planner" className="h-0 scroll-mt-24" />
        <WizardHeader
          steps={steps}
          currentStep={step}
          canNavigateToStep={canNavigateToStep}
          onStepClick={setStep}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
              height: { duration: 0.4, ease: 'easeInOut' },
            }}
            className="w-full overflow-hidden min-h-[300px] max-w-5xl mx-auto"
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
