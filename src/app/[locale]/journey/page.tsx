'use client';

import { Suspense, useEffect, useState } from 'react';
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
  if (!excuse) return { tabId: 'excuse', sectionId: 'excuse' };
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

  const resolvedLocale = hasLocale(locale) ? locale : 'es';

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  useEffect(() => {
    const { tabId, sectionId } = getInitialStepFromParams(searchParams);
    setActiveTab(tabId);
    setOpenSectionId(sectionId);
  }, [searchParams]);

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

      <div className="container mx-auto px-4 py-8">
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
              localizedExcuses={journey.excuses}
              localizedTravelerTypes={dict.home.explorationTravelerTypes}
              mainContentLabels={journey.mainContent}
              onOpenSection={setOpenSectionId}
              onTabChange={handleTabChange}
              openSectionId={openSectionId}
            />
          </div>

          <JourneySummary
            onEdit={handleSummaryEdit}
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
