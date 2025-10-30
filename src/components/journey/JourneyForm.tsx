'use client';
import { WizardHeader } from '@/components/WizardHeader';
import LogisticsTab from './LogisticsTab';
import PreferencesTab from './PreferencesTab';
import StepperNav from './StepperNav';
import { AnimatePresence, motion } from 'framer-motion';
import { Level, LEVELS } from '@/lib/data/shared/levels';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/store';
import AddonsGallery from './addons/AddonsGallery';

export function JourneyForm() {
  const { activeTab, setPartial } = useStore();
  const searchParams = useSearchParams();

  // Get level from searchParams or use default
  const levelParam = searchParams.get('level');
  const level: Level = LEVELS.find((l) => l.id === levelParam) || LEVELS[0];

  // Check if coming from TypePlanner (has type and level params)
  const isFromTypePlanner = Boolean(
    searchParams.get('type') && searchParams.get('level'),
  );

  // Map string tabs to numbers for component logic
  const tabToNumber: Record<string, number> = {
    logistics: 1,
    preferences: 2,
    addons: 3,
  };

  const numberToTab: Record<number, 'logistics' | 'preferences' | 'addons'> = {
    1: 'logistics',
    2: 'preferences',
    3: 'addons',
  };

  const currentStep = tabToNumber[activeTab];

  const steps = [
    { step: 1, label: 'Planificá tu Aventura Sorpresa' },
    { step: 2, label: 'Preferencias y Filtros' },
    { step: 3, label: 'Extras' },
  ];

  // Get store data for validation
  const { logistics, filters } = useStore();

  // Validation function to check if a step is complete
  const isStepComplete = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return Boolean(
          logistics.country?.length > 0 &&
            logistics.city?.length > 0 &&
            logistics.startDate &&
            logistics.endDate &&
            logistics.nights > 0 &&
            logistics.pax > 0,
        );
      case 2:
        return true;
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
    if (targetStep <= currentStep) return true;

    // Can only go forward if all previous steps are complete
    for (let i = 1; i < targetStep; i++) {
      if (!isStepComplete(i)) return false;
    }

    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setPartial({ activeTab: numberToTab[targetStep] });
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'logistics':
        return <LogisticsTab level={level} />;
      case 'preferences':
        return <PreferencesTab />;
      case 'addons':
        return <AddonsGallery />;
      default:
        return <LogisticsTab level={level} />;
    }
  };

  console.log('logistics', logistics);

  return (
    <div className="bg-gray-100 p-4 rounded-md  mx-auto mb-12 border border-gray-200 py-6">
      <WizardHeader
        steps={steps}
        currentStep={currentStep}
        canNavigateToStep={canNavigateToStep}
        onStepClick={handleStepClick}
        hideProgressBar={true}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
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

      <StepperNav
        steps={steps}
        currentStep={currentStep}
        isStepComplete={isStepComplete}
        onStepChange={(step) => setPartial({ activeTab: numberToTab[step] })}
      />
    </div>
  );
}
