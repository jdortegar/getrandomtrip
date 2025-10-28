'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_TIERS_CONTENT } from '@/content/experienceTiers';
import Details from '@/components/by-type/shared/Details';
import { WizardHeader } from '@/components/WizardHeader';
import Presupuesto from '@/components/by-type/shared/Presupuesto';
import Excuse from '@/components/by-type/shared/Excuse';
import Section from '@/components/layout/Section';
import {
  TRAVELLER_TYPE_OPTIONS,
  TRAVELLER_TYPE_MAP,
} from '@/lib/constants/traveller-types';
import { getTravelerType } from '@/lib/data/traveler-types';
import OriginStep from './steps/OriginStep';
import TravelerTypeStep from './steps/TravelerTypeStep';

type Props = {
  tripperData: {
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
  tripperData,
  tripperPackages = [],
}: Props) {
  // PLAN DATA
  const [planData, setPlanData] = useState<{
    origin: {
      city: string;
      country: string;
    } | null;
    travellerType: string | null;
    budgetTier: string | null;
  } | null>(null);

  const [step, setStep] = useState<number>(1);
  const [travellerType, setTravellerType] = useState<string | null>(null);
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(
    null,
  );
  const [excuseKey, setExcuseKey] = useState<string | null>(null);

  const sectionRef = useRef<HTMLDivElement>(null);
  const firstName =
    tripperData.name?.split(' ')[0] || tripperData.name || 'este tripper';

  // Filter by tripper's available types
  const availableTypes = tripperData.availableTypes || [];
  const travellerOptions =
    availableTypes.length > 0
      ? TRAVELLER_TYPE_OPTIONS.filter((opt) => availableTypes.includes(opt.key))
      : TRAVELLER_TYPE_OPTIONS;

  // Get tiers for selected traveller type, filtered by tripper's actual packages
  const tiers = useMemo(() => {
    if (!planData?.travellerType) return [];

    const selectedTiers =
      ALL_TIERS_CONTENT[
        planData.travellerType as keyof typeof ALL_TIERS_CONTENT
      ];

    if (!selectedTiers) return [];

    const filteredTiers = Object.entries(selectedTiers).filter(
      ([key, content]) => {
        return tripperPackages.some((pkg) => pkg.level === key);
      },
    );

    return filteredTiers.map(([key, content]) => {
      // Apply commission
      const basePrice =
        parseFloat(content.priceLabel.replace(/[^0-9.]/g, '')) || 0;
      const commission = tripperData.commission || 0;
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
        name: content.title,
        subtitle: content.description,
        priceLabel,
        priceFootnote,
        features: content.features,
        closingLine: content.closingLine,
        ctaLabel: content.ctaLabel,
      };
    });
  }, [planData?.travellerType, tripperData, firstName, tripperPackages]);

  // Get traveler type data for selected type
  const travellerTypeData = useMemo(() => {
    if (!travellerType) return null;
    const mappedType = TRAVELLER_TYPE_MAP[travellerType] || travellerType;
    return getTravelerType(mappedType);
  }, [travellerType]);

  // Excuse cards from traveler type data - show all general content
  const excuseCards = useMemo(() => {
    const typeCards = travellerTypeData?.planner?.steps?.excuse?.cards || [];
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
      { step: 1, label: 'Origen' },
      { step: 2, label: 'Tipo de viajero' },
      { step: 3, label: 'Presupuesto' },
      { step: 4, label: 'La Excusa' },
      { step: 5, label: 'Afinar detalles' },
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
          travellerType !== null && budgetTier !== null && excuseKey !== null
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
          <OriginStep
            origin={planData?.origin!}
            handlePlanData={(origin) => setPlanData({ ...planData!, origin })}
            onContinue={() => setStep(2)}
            tripperName={firstName}
          />
        );
      case 2:
        return (
          <TravelerTypeStep
            options={travellerOptions}
            handlePlanData={(travellerType) =>
              setPlanData({ ...planData!, travellerType })
            }
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
            tripperName={firstName}
          />
        );

      case 3:
        return (
          <Presupuesto
            budgetTier={planData?.budgetTier!}
            content={{
              title: `Elige tu presupuesto con ${firstName}`,
              tagline: 'Selecciona el nivel de experiencia que buscas',
            }}
            plannerId="tripper-planner"
            setBudgetTier={(budgetTier) =>
              setPlanData({ ...planData!, budgetTier })
            }
            setPendingPriceLabel={setPendingPriceLabel}
            setStep={handleStepChange}
            tiers={tiers}
            type={travellerType || 'solo'}
          />
        );

      case 4:
        return (
          <Excuse
            excuseCards={excuseCards}
            content={{
              title: '¿Qué los mueve a viajar?',
              tagline: `${firstName} diseñará tu experiencia según tu motivación`,
              cards: excuseCards,
            }}
            plannerId="tripper-planner"
            setExcuseKey={(key: string | null) => setExcuseKey(key)}
            setStep={handleStepChange}
          />
        );

      case 5:
        return (
          <Details
            excuseKey={excuseKey}
            excuseOptions={travellerTypeData?.planner?.excuseOptions || {}}
            budgetTier={budgetTier}
            content={{
              title: 'Afina los detalles finales',
              tagline: 'Personaliza tu aventura con las opciones que prefieras',
              ctaLabel: 'Ver resumen del viaje →',
            }}
            pendingPriceLabel={pendingPriceLabel}
            setStep={() => handleStepChange(3)}
            type={travellerType || 'solo'}
            tripperSlug={tripperData?.slug}
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
