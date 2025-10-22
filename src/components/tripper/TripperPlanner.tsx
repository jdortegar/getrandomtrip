'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import clsx from 'clsx';
import { ALL_TIERS_CONTENT } from '@/content/experienceTiers';
import AfinarDetalles from '@/components/by-type/shared/AfinarDetalles';
import { WizardHeader } from '@/components/WizardHeader';
import Presupuesto from '@/components/by-type/shared/Presupuesto';
import LaExcusa from '@/components/by-type/shared/LaExcusa';
import type { Tripper } from '@/content/trippers';
import Section from '@/components/layout/Section';
import {
  TRAVELLER_TYPE_OPTIONS,
  TRAVELLER_TYPE_MAP,
} from '@/lib/constants/traveller-types';
import { getTravelerType } from '@/lib/data/traveler-types';

type Props = {
  staticTripper: Tripper;
  tripperData?: {
    id: string;
    name: string;
    slug: string;
    commission: number;
    availableTypes: string[];
  };
};

export default function TripperPlanner({
  staticTripper: t,
  tripperData,
}: Props) {
  const [step, setStep] = useState<number>(1);
  const [travellerType, setTravellerType] = useState<string | null>(null);
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(
    null,
  );
  const [almaKey, setAlmaKey] = useState<string | null>(null);

  const sectionRef = useRef<HTMLDivElement>(null);
  const firstName = t.name?.split(' ')[0] || t.name || 'este tripper';

  // Filter by tripper's available types (DB first, then static fallback)
  const availableTypes = tripperData?.availableTypes || t.availableTypes || [];
  const travellerOptions =
    availableTypes.length > 0
      ? TRAVELLER_TYPE_OPTIONS.filter((opt) => availableTypes.includes(opt.key))
      : TRAVELLER_TYPE_OPTIONS;

  // Get tiers for selected traveller type
  const tiers = useMemo(() => {
    if (!travellerType) return [];

    const mappedType =
      (TRAVELLER_TYPE_MAP[travellerType] as keyof typeof ALL_TIERS_CONTENT) ||
      'solo';
    const selectedTiers = ALL_TIERS_CONTENT[mappedType];

    if (!selectedTiers) return [];

    return Object.entries(selectedTiers).map(
      ([key, content]: [string, any]) => {
        const titleParts = content.title.split('—');
        const name = titleParts[0]?.trim() || content.title;
        const subtitle = titleParts[1]?.trim() || '';

        // Apply commission (DB first, then static fallback)
        const basePrice =
          parseFloat(content.priceLabel.replace(/[^0-9.]/g, '')) || 0;
        const commission = tripperData?.commission || t.commission || 0;
        const finalPrice = basePrice * (1 + commission);

        const priceLabel =
          commission > 0 ? `$${finalPrice.toFixed(0)} USD` : content.priceLabel;

        const priceFootnote =
          commission > 0
            ? `Incluye curación de ${firstName} (${(commission * 100).toFixed(0)}%)`
            : content.priceFootnote;

        return {
          id: key,
          key,
          name,
          subtitle,
          priceLabel,
          priceFootnote,
          features: content.bullets.map((bullet: string) => ({
            label: '',
            text: bullet,
          })),
          closingLine: content.closingLine,
          ctaLabel: content.ctaLabel,
        };
      },
    );
  }, [travellerType, tripperData, firstName]);

  // Get traveler type data for selected type
  const travellerTypeData = useMemo(() => {
    if (!travellerType) return null;
    const mappedType = TRAVELLER_TYPE_MAP[travellerType] || travellerType;
    return getTravelerType(mappedType);
  }, [travellerType]);

  // Alma cards from traveler type data, filtered by tripper interests
  const almaCards = useMemo(() => {
    const typeCards = travellerTypeData?.planner?.steps?.laExcusa?.cards || [];

    if (!t.interests || t.interests.length === 0) return typeCards;

    return typeCards.filter((card) =>
      t.interests!.some((interest) =>
        card.title.toLowerCase().includes(interest.toLowerCase()),
      ),
    );
  }, [travellerTypeData, t.interests]);

  const scrollPlanner = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    if (h === '#planner' || h === '#start-your-journey-anchor') {
      scrollPlanner();
    }
  }, []);

  // Wizard steps - dynamic labels from traveler type data
  const wizardSteps = useMemo(
    () => [
      { step: 1, label: 'Tipo de Viaje' },
      { step: 2, label: 'Presupuesto' },
      {
        step: 3,
        label: travellerTypeData?.planner?.steps?.step2Label || 'La Excusa',
      },
      { step: 4, label: 'Detalles' },
    ],
    [travellerTypeData],
  );

  const canNavigateToStep = (targetStep: number): boolean => {
    switch (targetStep) {
      case 1:
        return true;
      case 2:
        return travellerType !== null;
      case 3:
        return travellerType !== null && budgetTier !== null;
      case 4:
        return (
          travellerType !== null && budgetTier !== null && almaKey !== null
        );
      default:
        return false;
    }
  };

  const handleStepChange = (newStep: number) => {
    if (canNavigateToStep(newStep)) {
      setStep(newStep);
      setTimeout(scrollPlanner, 100);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
            exit={{ opacity: 0, y: -20 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 md:text-3xl">
                ¿Qué tipo de viaje estás planeando?
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-gray-600">
                Selecciona el estilo de viaje que {firstName} diseñará para ti
              </p>
            </div>

            <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
              {travellerOptions.map((opt) => (
                <button
                  key={opt.key}
                  aria-label={`Seleccionar viaje ${opt.title}`}
                  className="group relative h-80 w-full max-w-sm overflow-hidden rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-80"
                  onClick={() => {
                    setTravellerType(opt.key);
                    setTimeout(() => {
                      setStep(2);
                      scrollPlanner();
                    }, 300);
                  }}
                >
                  <Image
                    alt={opt.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    fill
                    src={opt.img}
                  />
                  <div className="absolute inset-0 z-10 rounded-lg bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-20 p-6 text-white">
                    <h4 className="text-2xl font-bold">{opt.title}</h4>
                    <p className="mt-1 text-sm text-white/90">{opt.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <Presupuesto
            budgetTier={budgetTier}
            content={
              travellerTypeData?.planner?.steps?.presupuesto || {
                title: `Elige tu presupuesto con ${firstName}`,
                tagline: 'Selecciona el nivel de experiencia que buscas',
              }
            }
            plannerId="tripper-planner"
            setBudgetTier={setBudgetTier}
            setPendingPriceLabel={setPendingPriceLabel}
            setStep={() => handleStepChange(3)}
            tiers={tiers}
            type={travellerType || 'solo'}
          />
        );

      case 3:
        return (
          <LaExcusa
            almaCards={almaCards}
            content={
              travellerTypeData?.planner?.steps?.laExcusa || {
                title: '¿Qué los mueve a viajar?',
                tagline: `${firstName} diseñará tu experiencia según tu motivación`,
                cards: almaCards,
              }
            }
            plannerId="tripper-planner"
            setAlmaKey={(key) => {
              setAlmaKey(key);
              setTimeout(() => handleStepChange(4), 100);
            }}
            setStep={() => handleStepChange(2)}
          />
        );

      case 4:
        return (
          <AfinarDetalles
            almaKey={almaKey}
            almaOptions={travellerTypeData?.planner?.almaOptions || {}}
            budgetTier={budgetTier}
            content={
              travellerTypeData?.planner?.steps?.afinarDetalles || {
                title: 'Afina los detalles finales',
                tagline:
                  'Personaliza tu aventura con las opciones que prefieras',
                ctaLabel: 'Ver resumen del viaje →',
              }
            }
            pendingPriceLabel={pendingPriceLabel}
            setStep={() => handleStepChange(3)}
            type={travellerType || 'solo'}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Section
      className="bg-gradient-to-b from-white to-gray-50 py-20"
      fullWidth={true}
      id="planner"
    >
      <div ref={sectionRef} className="scroll-mt-24">
        {/* Custom Trip Builder */}
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-caveat text-4xl font-bold text-gray-900 md:text-5xl">
              Diseña tu Randomtrip con {firstName}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              {firstName} se especializa en crear experiencias inolvidables.
              Sigue estos pasos para construir tu próximo gran viaje.
            </p>
          </div>

          {/* Wizard Header */}
          <WizardHeader
            canNavigateToStep={canNavigateToStep}
            currentStep={step}
            onStepClick={handleStepChange}
            steps={wizardSteps}
          />

          {/* Step Content with Animation */}
          <div className="mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="min-h-[400px] w-full overflow-hidden"
                exit={{ opacity: 0, y: -20, height: 0 }}
                initial={{ opacity: 0, y: 20, height: 0 }}
                transition={{
                  duration: 0.5,
                  ease: 'easeInOut',
                  height: { duration: 0.4, ease: 'easeInOut' },
                }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}
