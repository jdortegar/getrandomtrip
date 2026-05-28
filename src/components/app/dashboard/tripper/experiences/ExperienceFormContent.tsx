'use client';

import type React from 'react';
import { Accordion } from '@/components/ui/accordion';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { JourneyActionBar } from '@/components/journey/JourneyActionBar';
import { AboutExperienceStep } from './steps/AboutExperienceStep';
import { AboutDestinationStep } from './steps/AboutDestinationStep';
import { CapacityDurationStep } from './steps/CapacityDurationStep';
import { CapacityPricingStep } from './steps/CapacityPricingStep';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from '@/types/tripper';

interface ExperienceFormContentProps {
  activeTab: string;
  copy: TripperExperiencesDict['form'];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
  onClearAll: () => void;
  onNext: () => void;
  openSectionId: string;
  onSectionChange: (id: string) => void;
  tabs: TripperExperiencesDict['form']['contentTabs'];
}

function resolveStepContent(
  activeTab: string,
  substepId: string,
  form: ExperienceFormDraft,
  onChange: ExperienceFormDraftOnChange,
  copy: TripperExperiencesDict['form'],
): React.ReactNode {
  if (activeTab === 'about') {
    if (substepId === 'experience') return <AboutExperienceStep copy={copy} form={form} onChange={onChange} />;
    if (substepId === 'destination') return <AboutDestinationStep copy={copy} form={form} onChange={onChange} />;
  }
  if (activeTab === 'capacity') {
    if (substepId === 'capacity-duration') return <CapacityDurationStep copy={copy} form={form} onChange={onChange} />;
    if (substepId === 'pricing') return <CapacityPricingStep copy={copy} form={form} onChange={onChange} />;
  }
  return null;
}

export function ExperienceFormContent({
  activeTab,
  copy,
  form,
  onChange,
  onClearAll,
  onNext,
  openSectionId,
  onSectionChange,
  tabs,
}: ExperienceFormContentProps) {
  const currentTab = tabs.find((t) => t.id === activeTab);
  if (!currentTab) return null;

  const isLastTab = tabs[tabs.length - 1]?.id === activeTab;
  const hasValues = !!(form.title || form.teaser || form.description);

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        type="single"
        collapsible
        value={openSectionId}
        onValueChange={onSectionChange}
        className="flex flex-col gap-4"
      >
        {currentTab.substeps.map((substep, i) => (
          <JourneyDropdown
            key={substep.id}
            value={substep.id}
            label={substep.title}
            content={i === 0 ? '' : 'Filtrar'}
          >
            {resolveStepContent(activeTab, substep.id, form, onChange, copy)}
          </JourneyDropdown>
        ))}
      </Accordion>

      <JourneyActionBar
        canContinue
        isAllStepsComplete={isLastTab}
        isSavingAndRedirecting={false}
        labels={{
          clearAll: copy.actionBar.clearAll,
          next: copy.actionBar.next,
          viewCheckout: copy.actionBar.submit,
        }}
        onClearAll={onClearAll}
        onContinue={onNext}
        onGoToCheckout={onNext}
        showClearAll={hasValues}
      />
    </div>
  );
}
