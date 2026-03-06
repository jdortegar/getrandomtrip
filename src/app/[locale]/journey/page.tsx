'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useSearchParams } from 'next/navigation';
import JourneyContentNavigation from '@/components/journey/JourneyContentNavigation';
import HeaderHero from '@/components/journey/HeaderHero';
import JourneyMainContent from '@/components/journey/JourneyMainContent';
import JourneyProgressSidebar from '@/components/journey/JourneyProgressSidebar';
import JourneySummary from '@/components/journey/JourneySummary';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { getHasExcuseStep } from '@/lib/helpers/excuse-helper';

function getAccordionForStep(tabId: string, substepId?: string): string {
  switch (tabId) {
    case 'budget':
      return substepId === 'experience' ? 'experience' : 'travel-type';
    case 'excuse':
      return substepId === 'refine-details' ? 'refine-details' : 'excuse';
    case 'details':
      if (substepId === 'dates') return 'dates';
      if (substepId === 'transport') return 'transport';
      return 'origin';
    case 'preferences':
      return substepId === 'addons' ? 'addons' : 'filters';
    default:
      return '';
  }
}

function getTabForSection(sectionId: string): string {
  switch (sectionId) {
    case 'travel-type':
    case 'experience':
      return 'budget';
    case 'excuse':
    case 'refine-details':
      return 'excuse';
    case 'origin':
    case 'dates':
    case 'transport':
      return 'details';
    case 'filters':
    case 'addons':
      return 'preferences';
    default:
      return 'budget';
  }
}

function getInitialStepFromParams(params: URLSearchParams): {
  sectionId: string;
  tabId: string;
} {
  const travelType = params.get('travelType');
  const experience = params.get('experience');
  const excuse = params.get('excuse');
  const originCountry = params.get('originCountry');
  const originCity = params.get('originCity');
  const startDate = params.get('startDate');
  const nights = params.get('nights');
  const transport = params.get('transport');

  if (!travelType) return { tabId: 'budget', sectionId: 'travel-type' };
  if (!experience) return { tabId: 'budget', sectionId: 'experience' };
  const hasExcuseStep = getHasExcuseStep(travelType ?? '', experience ?? '');
  if (hasExcuseStep && !excuse) return { tabId: 'excuse', sectionId: 'excuse' };
  // Stay on excuse step (refine-details) until user clicks Next; card click must not advance
  if (hasExcuseStep && excuse)
    return { tabId: 'excuse', sectionId: 'refine-details' };
  if (!originCountry || !originCity)
    return { tabId: 'details', sectionId: 'origin' };
  if (!startDate || !nights) return { tabId: 'details', sectionId: 'dates' };
  if (!transport) return { tabId: 'details', sectionId: 'transport' };
  return { tabId: 'preferences', sectionId: 'filters' };
}

function JourneyPageContent({ locale }: { locale?: string }) {
  const searchParams = useSearchParams();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [activeTab, setActiveTab] = useState('budget');
  const [openSectionId, setOpenSectionId] = useState('travel-type');
  const contentRef = useRef<HTMLDivElement>(null);

  const resolvedLocale = hasLocale(locale) ? locale : 'es';

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  useEffect(() => {
    const { tabId, sectionId } = getInitialStepFromParams(searchParams);
    setActiveTab(tabId);
    setOpenSectionId(sectionId);
    // Only re-sync when step-determining params change (not on every keystroke in origin/dates/transport)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepKey: only travelType, experience, excuse drive step
  }, [
    searchParams.get('travelType'),
    searchParams.get('experience'),
    searchParams.get('excuse'),
  ]);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleStepClick = (tabId: string, substepId?: string) => {
    setActiveTab(tabId);
    setOpenSectionId(getAccordionForStep(tabId, substepId));
  };

  const handleSummaryEdit = (sectionId: string) => {
    setActiveTab(getTabForSection(sectionId));
    setOpenSectionId(sectionId);
  };

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const journey = dict.journey;
  const contentTabs = journey.contentTabs;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description={journey.hero.description}
        subtitle={journey.hero.subtitle}
        title={journey.hero.title}
      />

      <JourneyContentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={contentTabs.map((tab) => ({ id: tab.id, label: tab.label }))}
        user={{
          name: journey.userNamePlaceholder,
        }}
      />

      <div
        className="container mx-auto px-4 py-8"
        ref={contentRef}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr_320px]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <JourneyProgressSidebar
              activeTab={activeTab}
              onStepClick={handleStepClick}
              tabs={contentTabs}
            />
          </div>

          <div className="min-w-0">
            <JourneyMainContent
              activeTab={activeTab}
              addonLabels={journey.addons}
              detailsStepLabels={journey.detailsStep}
              localizedExcuses={journey.excuses}
              localizedRefineOptions={journey.refineDetailOptions}
              localizedTravelerTypes={dict.home.explorationTravelerTypes}
              mainContentLabels={journey.mainContent}
              onOpenSection={setOpenSectionId}
              onTabChange={handleTabChange}
              openSectionId={openSectionId}
              preferencesStepLabels={journey.preferencesStep}
            />
          </div>

          <JourneySummary
            addonLabels={journey.addons}
            filterOptions={journey.preferencesStep?.filterOptions}
            localizedExcuses={journey.excuses}
            onEdit={handleSummaryEdit}
            refineDetailOptions={journey.refineDetailOptions}
            summary={journey.summary}
          />
        </div>
      </div>
    </div>
  );
}

export default function JourneyPage({
  params,
}: {
  params?: { locale?: string };
}) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <JourneyPageContent locale={params?.locale} />
    </Suspense>
  );
}
