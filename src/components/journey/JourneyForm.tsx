'use client';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { WizardHeader } from '@/components/WizardHeader';
import LogisticsTab from './LogisticsTab';
import PreferencesTab from './PreferencesTab';
import AvoidTab from './AvoidTab';
import { AnimatePresence, motion } from 'framer-motion';
import { Level, LEVELS } from '@/lib/data/levels';
import { LevelSlug } from '@/store/slices/journeyStore';
import { useSearchParams } from 'next/navigation';

// Form data interface
interface JourneyFormData {
  // Step 1: Logistics
  country: string;
  city: string;
  startDate: string;
  nights: number;
  pax: number;

  // Step 2: Preferences
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;

  // Step 3: Avoid
  avoidCountries: string[];
  avoidCities: string[];
}

export function JourneyForm() {
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();

  // Get level from searchParams or use default
  const levelParam = searchParams.get('level');
  const level: Level = LEVELS.find((l) => l.id === levelParam) || LEVELS[0];

  const methods = useForm<JourneyFormData>({
    defaultValues: {
      country: '',
      city: '',
      startDate: '',
      nights: 1,
      pax: 1,
      transport: '',
      climate: '',
      maxTravelTime: '',
      departPref: '',
      arrivePref: '',
      avoidCountries: [],
      avoidCities: [],
    },
  });

  const steps = [
    { step: 1, label: 'Planificá tu Aventura Sorpresa' },
    { step: 2, label: 'Preferencias y Filtros' },
    { step: 3, label: 'Destinos a evitar' },
  ];

  // Validation function to check if a step is complete
  const isStepComplete = (stepNumber: number): boolean => {
    const formValues = methods.getValues();

    switch (stepNumber) {
      case 1:
        return Boolean(
          formValues.country?.trim() &&
            formValues.city?.trim() &&
            formValues.startDate?.trim() &&
            formValues.nights > 0 &&
            formValues.pax > 0,
        );
      case 2:
        return Boolean(
          formValues.transport?.trim() &&
            formValues.climate?.trim() &&
            formValues.maxTravelTime?.trim() &&
            formValues.departPref?.trim() &&
            formValues.arrivePref?.trim(),
        );
      case 3:
        // Step 3 is optional, so it's always considered complete
        return true;
      default:
        return false;
    }
  };

  // Check if user can navigate to a specific step
  const canNavigateToStep = (targetStep: number): boolean => {
    // Can always go back to previous steps
    if (targetStep <= step) return true;

    // Can only go forward if all previous steps are complete
    for (let i = 1; i < targetStep; i++) {
      if (!isStepComplete(i)) return false;
    }

    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
  };

  const renderActiveTab = () => {
    switch (step) {
      case 1:
        return <LogisticsTab level={level} />;
      case 2:
        return <PreferencesTab />;
      case 3:
        return <AvoidTab />;
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-md max-w-4xl mx-auto mb-12 border border-gray-200 py-6">
      <WizardHeader
        steps={steps}
        currentStep={step}
        canNavigateToStep={canNavigateToStep}
        onStepClick={handleStepClick}
        hideProgressBar={true}
      />

      <FormProvider {...methods}>
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
      </FormProvider>
    </div>
  );
}
