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
import { prisma } from '@/lib/prisma';

type Props = {
  staticTripper: Tripper;
  tripperData?: {
    id: string;
    name: string;
    slug: string;
    commission: number;
    availableTypes: string[];
  };
  tripperPackages?: {
    type: string;
    level: string;
  }[];
};

export default function TripperPlanner({
  staticTripper: t,
  tripperData,
  tripperPackages = [],
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

  // Get tiers for selected traveller type, filtered by tripper's actual packages
  const tiers = useMemo(() => {
    if (!travellerType) return [];

    const mappedType =
      (TRAVELLER_TYPE_MAP[travellerType] as keyof typeof ALL_TIERS_CONTENT) ||
      'solo';
    const selectedTiers = ALL_TIERS_CONTENT[mappedType];

    if (!selectedTiers) return [];

    // Check if this is Randomtrip tripper (shows all levels)
    const isRandomtripTripper =
      t.slug === 'randomtrip' || t.name?.toLowerCase().includes('randomtrip');

    // Show general content for this traveler type
    // If tripper has specific levels for this type, show those; otherwise show all general tiers
    const tripperLevelsForType = tripperPackages
      .filter((pkg) => pkg.type === travellerType)
      .map((pkg) => pkg.level)
      .filter((level, index, array) => array.indexOf(level) === index); // Remove duplicates

    // Use tripper's specific levels if available, otherwise show all general tiers

    const levelsToShow = isRandomtripTripper
      ? Object.keys(selectedTiers) // Randomtrip shows all levels
      : tripperLevelsForType.length > 0
        ? tripperLevelsForType
        : Object.keys(selectedTiers); // Fallback to all general tiers

    // Filter tiers to show general content
    const filteredTiers = Object.entries(selectedTiers).filter(([key]) => {
      return levelsToShow.includes(key);
    });

    return filteredTiers.map(([key, content]: [string, any]) => {
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
    });
  }, [travellerType, tripperData, firstName, t.slug, t.name, tripperPackages]);

  // Get traveler type data for selected type
  const travellerTypeData = useMemo(() => {
    if (!travellerType) return null;
    const mappedType = TRAVELLER_TYPE_MAP[travellerType] || travellerType;
    return getTravelerType(mappedType);
  }, [travellerType]);

  // Alma cards from traveler type data - show all general content
  const almaCards = useMemo(() => {
    const typeCards = travellerTypeData?.planner?.steps?.laExcusa?.cards || [];
    return typeCards;
  }, [travellerTypeData]);

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
        return true; // Always allow going back to step 1
      case 2:
        return travellerType !== null; // Can go to step 2 if traveler type is selected
      case 3:
        return travellerType !== null && budgetTier !== null; // Can go to step 3 if both traveler type and budget are selected
      case 4:
        return (
          travellerType !== null && budgetTier !== null && almaKey !== null
        ); // Can go to step 4 if all previous steps are completed
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
                  className="group relative h-80 w-full max-w-sm overflow-hidden rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-80 cursor-pointer"
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
                    <h4 className="text-2xl font-bold font-caveat">
                      {opt.title}
                    </h4>
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
            content={{
              title: `Elige tu presupuesto con ${firstName}`,
              tagline: 'Selecciona el nivel de experiencia que buscas',
            }}
            plannerId="tripper-planner"
            setBudgetTier={setBudgetTier}
            setPendingPriceLabel={setPendingPriceLabel}
            setStep={handleStepChange}
            tiers={tiers}
            type={travellerType || 'solo'}
          />
        );

      case 3:
        return (
          <LaExcusa
            almaCards={almaCards}
            content={{
              title: '¿Qué los mueve a viajar?',
              tagline: `${firstName} diseñará tu experiencia según tu motivación`,
              cards: almaCards,
            }}
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
            content={{
              title: 'Afina los detalles finales',
              tagline: 'Personaliza tu aventura con las opciones que prefieras',
              ctaLabel: 'Ver resumen del viaje →',
            }}
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
      className="py-20"
      fullWidth={true}
      subtitle={`${firstName} se especializa en crear experiencias inolvidables. Sigue estos pasos para planificar tu próximo gran viaje.`}
      title={`Planifica tu Randomtrip con ${firstName}`}
    >
      <div className="relative">
        <div ref={sectionRef} id="planner" className="h-0 scroll-mt-24" />
        <WizardHeader
          canNavigateToStep={canNavigateToStep}
          currentStep={step}
          onStepClick={handleStepChange}
          steps={wizardSteps}
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
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
