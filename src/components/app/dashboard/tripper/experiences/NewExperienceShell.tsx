'use client';

import { useRef, useState } from 'react';
import JourneyContentNavigation from '@/components/journey/JourneyContentNavigation';
import JourneyProgressSidebar from '@/components/journey/JourneyProgressSidebar';
import { ExperienceFormContent } from './ExperienceFormContent';
import type { ExperienceFormDraft } from '@/types/tripper';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { JourneyUserBadgeLabels } from '@/components/journey/JourneyUserBadge';

interface NewExperienceShellProps {
  dict: TripperExperiencesDict['form'];
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
}

const EMPTY_DRAFT: ExperienceFormDraft = {
  title: '',
  type: 'couple',
  level: 'essenza',
  teaser: '',
  description: '',
  destinationCountry: '',
  destinationCity: '',
  excuseKey: '',
  minPax: 1,
  maxPax: 1,
  maxNights: 2,
  estimatedCost: '',
  season: '',
};

export function NewExperienceShell({ dict, userBadgeLabels }: NewExperienceShellProps) {
  const tabs = dict.contentTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'about');
  const [openSectionId, setOpenSectionId] = useState(tabs[0]?.substeps[0]?.id ?? '');
  const [form, setForm] = useState<ExperienceFormDraft>(EMPTY_DRAFT);
  const contentRef = useRef<HTMLDivElement>(null);

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    const firstSubstep = tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? '';
    setOpenSectionId(firstSubstep);
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleStepClick(tabId: string, substepId?: string) {
    setActiveTab(tabId);
    setOpenSectionId(substepId ?? tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? '');
  }

  function handleNext() {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    if (nextTab) handleTabChange(nextTab.id);
  }

  function handleClearAll() {
    setForm(EMPTY_DRAFT);
  }

  function handleChange<K extends keyof ExperienceFormDraft>(key: K, value: ExperienceFormDraft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const navTabs = tabs.map((t) => ({ id: t.id, label: t.label }));

  return (
    <div className="bg-gray-50">
      <JourneyContentNavigation
        activeTab={activeTab}
        className="py-6"
        hideProfile
        onTabChange={handleTabChange}
        tabs={navTabs}
        userBadgeLabels={userBadgeLabels}
      />

      <div className="rt-container py-8 " ref={contentRef}>
        <div className="flex flex-col lg:flex-row w-full gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
            <JourneyProgressSidebar
              activeTab={activeTab}
              addonsComingSoonLabel=""
              onStepClick={handleStepClick}
              tabs={tabs}
            />
          </div>

          {/* Form */}
          <div className="min-w-0 flex-1">
            <ExperienceFormContent
              activeTab={activeTab}
              copy={dict}
              form={form}
              onChange={handleChange}
              onClearAll={handleClearAll}
              onNext={handleNext}
              openSectionId={openSectionId}
              onSectionChange={setOpenSectionId}
              tabs={tabs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
