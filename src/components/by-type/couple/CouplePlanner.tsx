'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Presupuesto from '@/components/by-type/couple/Presupuesto';
import LaExcusa from '@/components/by-type/couple/LaExcusa';
import AfinarDetalles from '@/components/by-type/couple/AfinarDetalles';
import Section from '@/components/layout/Section';

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

  const WizardHeader = () => (
    <div className=" bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
        {/* Wizard Progress */}

        {/* Progress Bar */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-xs">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-8">
            {steps.map((item, index) => {
              const canNavigate = canNavigateToStep(item.step);
              const isCompleted = step > item.step;
              const isCurrent = step === item.step;

              return (
                <div
                  key={item.step}
                  className={`flex items-center ${
                    canNavigate
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => {
                    if (canNavigate) {
                      setStep(item.step);
                    }
                  }}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                      ${
                        isCurrent
                          ? 'bg-primary text-white'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : canNavigate
                              ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                              : 'bg-neutral-100 text-neutral-400'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : item.step}
                  </div>
                  <span
                    className={`
                      ml-2 text-sm font-medium transition-colors duration-200
                      ${
                        isCurrent
                          ? 'text-primary'
                          : canNavigate
                            ? 'text-neutral-600'
                            : 'text-neutral-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                  {index < 2 && (
                    <div
                      className={`
                        w-8 h-0.5 mx-4 transition-colors duration-200
                        ${isCompleted ? 'bg-green-500' : 'bg-neutral-200'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

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
        <WizardHeader />
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
