'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Details from '@/components/by-type/shared/Details';
import { WizardHeader } from '@/components/WizardHeader';
import Budget from '@/components/by-type/shared/Budget';
import Excuse from '@/components/by-type/shared/Excuse';
import Section from '@/components/layout/Section';
import {
  TRAVELLER_TYPE_OPTIONS,
  TRAVELLER_TYPE_MAP,
} from '@/lib/constants/traveller-types';
import { getTravelerType } from '@/lib/data/traveler-types';
import {
  isPackageGeographicallyValid,
  calculatePriceWithCommission,
} from '@/lib/helpers/package-geography';
import {
  getExcuseByKey,
  getExcuseTitle,
  getExcuseDescription,
} from '@/lib/helpers/excuse-helper';
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
  tripperPackagesByType?: Record<string, Record<string, any[]>>;
};

export default function TripperPlanner({
  tripperData,
  tripperPackages = [],
  tripperPackagesByType = {},
}: Props) {
  // PLAN DATA
  const [planData, setPlanData] = useState<{
    origin: {
      city: string;
      country: string;
    } | null;
    travellerType: string | null;
    budgetLevel: string | null;
    excuseKey: string | null;
  } | null>(null);

  const [step, setStep] = useState<number>(1);
  // Get all data from planData for consistent state management
  const travellerType = planData?.travellerType || null;
  const budgetLevel = planData?.budgetLevel || null;
  const excuseKey = planData?.excuseKey || null;

  const sectionRef = useRef<HTMLDivElement>(null);
  const firstName =
    tripperData.name?.split(' ')[0] || tripperData.name || 'este tripper';

  // Filter by tripper's available types
  const availableTypes = tripperData.availableTypes || [];
  const travellerOptions =
    availableTypes.length > 0
      ? TRAVELLER_TYPE_OPTIONS.filter((opt) => availableTypes.includes(opt.key))
      : TRAVELLER_TYPE_OPTIONS;

  // Get traveler type data for selected type
  const travellerTypeData = useMemo(() => {
    if (!travellerType) return null;
    const mappedType = TRAVELLER_TYPE_MAP[travellerType] || travellerType;
    return getTravelerType(mappedType);
  }, [travellerType]);

  // Get levels from tripper's actual packages with commission pricing
  const levels = useMemo(() => {
    if (!travellerType || !tripperPackagesByType[travellerType]) {
      return [];
    }

    // Get all levels that this tripper has packages for this traveler type
    const tripperLevels = Object.keys(tripperPackagesByType[travellerType]);

    // Get base level data from traveler type data for structure
    const baseLevels = travellerTypeData?.planner?.levels || [];

    // Return only the levels that the tripper actually has packages for
    // and apply commission pricing
    return baseLevels
      .filter((level) => tripperLevels.includes(level.id))
      .map((level) => {
        // Apply tripper commission to pricing
        const basePrice =
          parseFloat(level.priceLabel.replace(/[^0-9.]/g, '')) || 0;
        const priceWithCommission = calculatePriceWithCommission(
          basePrice,
          tripperData.commission,
        );

        return {
          ...level,
          priceLabel: `$${priceWithCommission.toFixed(0)} USD`,
          priceFootnote: `Precio con comisión del ${tripperData.commission}%`,
        };
      });
  }, [
    travellerType,
    tripperPackagesByType,
    travellerTypeData,
    tripperData.commission,
  ]);

  // Excuse cards from tripper packages filtered by geography and level
  const excuseCards = useMemo(() => {
    if (!planData?.budgetLevel || !travellerType || !planData?.origin)
      return [];

    // Get tripper packages for the selected type and level
    const tripperPackages =
      tripperPackagesByType[travellerType]?.[planData.budgetLevel] || [];

    if (tripperPackages.length > 0) {
      // Filter packages by geographic criteria based on level
      const filteredPackages = tripperPackages.filter((pkg) =>
        isPackageGeographicallyValid(
          pkg,
          planData.origin!.country,
          planData.origin!.city,
          planData.budgetLevel!,
        ),
      );

      // Transform filtered packages to excuse cards based on excuseKey
      // Group packages by their excuseKey to create unique excuse cards
      const excuseMap = new Map();

      filteredPackages.forEach((pkg) => {
        // Only process packages that have valid excuse keys
        if (pkg.excuseKey) {
          if (!excuseMap.has(pkg.excuseKey)) {
            // Get excuse data from the excuse system
            const excuseData = getExcuseByKey(pkg.excuseKey);

            excuseMap.set(pkg.excuseKey, {
              key: pkg.excuseKey,
              title: excuseData?.title || getExcuseTitle(pkg.excuseKey),
              description:
                excuseData?.description || getExcuseDescription(pkg.excuseKey),
              img: excuseData?.img || pkg.heroImage,
              packages: [], // Will store all packages with this excuse
            });
          }

          // Add this package to the excuse's packages list
          excuseMap.get(pkg.excuseKey).packages.push(pkg);
        }
      });

      // Convert map to array and add package details
      return Array.from(excuseMap.values()).map((excuse) => {
        const firstPackage = excuse.packages[0];
        const priceWithCommission = calculatePriceWithCommission(
          firstPackage.basePriceUsd || 0,
          tripperData.commission,
        );

        return {
          ...excuse,
          price: `Desde $${priceWithCommission.toFixed(0)} USD`,
          destination: `${firstPackage.destinationCity}, ${firstPackage.destinationCountry}`,
          details: {
            title: excuse.title,
            core: excuse.description,
            ctaLabel: 'Ver detalles →',
            tint: 'bg-blue-900/30',
            heroImg: firstPackage.heroImage,
            options: excuse.packages.map((pkg: any) => ({
              key: pkg.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim(),
              label: pkg.title,
              desc: pkg.teaser,
              img: pkg.heroImage,
              destination: `${pkg.destinationCity}, ${pkg.destinationCountry}`,
              price: `$${calculatePriceWithCommission(pkg.basePriceUsd || 0, tripperData.commission).toFixed(0)} USD`,
            })),
          },
        };
      });
    }

    // Fallback to centralized data if no packages found
    const selectedLevel = levels.find(
      (level) => level.id === planData.budgetLevel,
    );
    return selectedLevel?.excuses || [];
  }, [
    levels,
    planData?.budgetLevel,
    planData?.origin,
    travellerType,
    tripperPackagesByType,
    tripperData.commission,
  ]);

  // Get unique package destinations for avoidDestinations context
  const packageDestinations = useMemo(() => {
    if (!travellerType || !planData?.budgetLevel) return [];

    const tripperPackages =
      tripperPackagesByType[travellerType]?.[planData.budgetLevel] || [];

    if (tripperPackages.length === 0) return [];

    // Filter packages by geographic criteria
    const filteredPackages = tripperPackages.filter((pkg) =>
      isPackageGeographicallyValid(
        pkg,
        planData.origin!.country,
        planData.origin!.city,
        planData.budgetLevel!,
      ),
    );

    // Extract unique destinations
    const destinationsMap = new Map<
      string,
      { city: string; country: string }
    >();
    filteredPackages.forEach((pkg: any) => {
      const key = `${pkg.destinationCity},${pkg.destinationCountry}`;
      if (!destinationsMap.has(key)) {
        destinationsMap.set(key, {
          city: pkg.destinationCity,
          country: pkg.destinationCountry,
        });
      }
    });

    return Array.from(destinationsMap.values());
  }, [
    travellerType,
    planData?.budgetLevel,
    planData?.origin,
    tripperPackagesByType,
  ]);

  console.log('packageDestinations', packageDestinations);

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
        return planData?.origin !== null; // Can go to step 2 if origin is selected
      case 3:
        return planData?.origin !== null && travellerType !== null; // Can go to step 3 if origin and traveler type are selected
      case 4:
        return (
          planData?.origin !== null &&
          travellerType !== null &&
          budgetLevel !== null
        ); // Can go to step 4 if origin, traveler type, and budget are selected
      case 5:
        return (
          planData?.origin !== null &&
          travellerType !== null &&
          budgetLevel !== null &&
          excuseKey !== null
        ); // Can go to step 5 if all previous steps are completed
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

  const handleBudgetLevelChange = (levelId: string | null) => {
    if (!levelId) return;
    // Update budget level and immediately go to step 4
    setPlanData({ ...planData!, budgetLevel: levelId });
    setStep(4);
    setTimeout(scrollPlanner, 100);
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
          <Budget
            budgetLevel={planData?.budgetLevel!}
            plannerId="tripper-planner"
            setBudgetLevel={handleBudgetLevelChange}
            setStep={handleStepChange}
            levels={levels}
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
            }}
            plannerId="tripper-planner"
            setExcuseKey={(key: string | null) =>
              setPlanData({ ...planData!, excuseKey: key })
            }
            setStep={handleStepChange}
            nextStep={5} // Go to step 5 (Details) in tripper planner
          />
        );

      case 5:
        return (
          <Details
            excuseKey={excuseKey}
            excuseOptions={(() => {
              if (!excuseKey) return {};

              // Find the selected excuse card from the excuseCards generated in step 4
              const selectedExcuseCard = excuseCards.find(
                (card) => card.key === excuseKey,
              );

              if (selectedExcuseCard && selectedExcuseCard.details) {
                return {
                  [excuseKey]: selectedExcuseCard.details,
                };
              }

              // Fallback to centralized data if no excuse card found
              const selectedLevel = levels.find(
                (level) => level.id === planData?.budgetLevel,
              );
              const fallbackExcuse = selectedLevel?.excuses.find(
                (excuse) => excuse.key === excuseKey,
              );
              return fallbackExcuse
                ? { [excuseKey]: fallbackExcuse.details }
                : {};
            })()}
            budgetLevel={budgetLevel}
            content={{
              title: 'Afina los detalles finales',
              tagline: 'Personaliza tu aventura con las opciones que prefieras',
              ctaLabel: 'Ver resumen del viaje →',
            }}
            setStep={handleStepChange}
            type={travellerType || 'solo'}
            tripperSlug={tripperData?.slug}
            origin={planData?.origin}
            packageDestinations={packageDestinations}
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
            className="w-full overflow-hidden min-h-[300px] mt-2"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
