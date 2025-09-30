'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Presupuesto from '@/components/by-type/couple/Presupuesto';
import LaExcusa from '@/components/by-type/couple/LaExcusa';
import AfinarDetalles from '@/components/by-type/couple/AfinarDetalles';

type Step = 'Presupuesto' | 'La Excusa' | 'Afinar detalles';

export default function CouplePlanner() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('Presupuesto');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(
    null,
  );
  const [coupleAlma, setCoupleAlma] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    const [, query] = h.split('?');
    const s = new URLSearchParams(query || '').get('step');
    if (s === 'budget') setStep('Presupuesto');
  }, []);

  // --------- Header ----------
  const getStepNumber = (currentStep: Step): number => {
    const stepMap = {
      Presupuesto: 1,
      'La Excusa': 2,
      'Afinar detalles': 3,
    };
    return stepMap[currentStep];
  };

  const getStepTitle = (currentStep: Step): string => {
    const titleMap = {
      Presupuesto: 'Presupuesto',
      'La Excusa': 'La Excusa',
      'Afinar detalles': 'Afinar detalles',
    };
    return titleMap[currentStep];
  };

  const Header = () => (
    <div className=" bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
        {/* Title and Subtitle - Testimonials Style */}
        <header className="text-center mb-12 text-gray-900">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 font-caveat">
            Diseñen su Randomtrip en pareja
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto font-jost text-gray-700">
            Tres pasos sencillos para vivir una historia que nadie más podrá
            contar.
          </p>
        </header>

        {/* Wizard Progress */}

        {/* Progress Bar */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-xs">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepNumber(step) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-8">
            {[
              { step: 'Presupuesto', label: 'Presupuesto', number: 1 },
              { step: 'La Excusa', label: 'La Excusa', number: 2 },
              { step: 'Afinar detalles', label: 'Detalles', number: 3 },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                    ${
                      step === item.step
                        ? 'bg-primary text-white'
                        : getStepNumber(step) > item.number
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                    }
                  `}
                >
                  {getStepNumber(step) > item.number ? '✓' : item.number}
                </div>
                <span
                  className={`
                    ml-2 text-sm font-medium transition-colors duration-200
                    ${step === item.step ? 'text-primary' : 'text-neutral-600'}
                  `}
                >
                  {item.label}
                </span>
                {index < 2 && (
                  <div
                    className={`
                      w-8 h-0.5 mx-4 transition-colors duration-200
                      ${getStepNumber(step) > item.number ? 'bg-green-500' : 'bg-neutral-200'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const goToStep = (stepIndex: number) => {
    const stepMap = ['Presupuesto', 'La Excusa', 'Afinar detalles'] as const;
    setStep(stepMap[stepIndex]);
  };

  const renderActiveTab = () => {
    switch (step) {
      case 'Presupuesto':
        return (
          <Presupuesto
            budgetTier={budgetTier}
            setBudgetTier={setBudgetTier}
            setPendingPriceLabel={setPendingPriceLabel}
            setStep={goToStep}
          />
        );
      case 'La Excusa':
        return <LaExcusa setCoupleAlma={setCoupleAlma} setStep={goToStep} />;
      case 'Afinar detalles':
        return (
          <AfinarDetalles
            coupleAlma={coupleAlma}
            budgetTier={budgetTier}
            pendingPriceLabel={pendingPriceLabel}
            setStep={goToStep}
          />
        );
    }

    return null;
  };

  return (
    <section className="min-h-[70vh] text-white py-16 px-4 md:px-8 relative">
      {/* overlay para contraste general */}
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[2px]" />
      {/* contenido */}
      <div className="relative">
        <div id="couple-planner" className="h-0 scroll-mt-24" />
        <Header />

        {renderActiveTab()}
      </div>
    </section>
  );
}
