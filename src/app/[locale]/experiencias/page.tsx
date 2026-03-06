'use client';

import React, { useCallback, useRef, useState } from 'react';
import Hero from '@/components/Hero';
import Section from '@/components/layout/Section';
import TypePlanner from '@/components/by-type/TypePlanner';
import { TravelerTypesCarousel } from '@/components/landing/exploration/TravelerTypesCarousel';
import { hasLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { TRAVELER_TYPES } from '@/lib/data/traveler-types';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';
import type { TypePlannerContent } from '@/types/planner';
import type { TravelerType } from '@/lib/data/travelerTypes';

const DEFAULT_TYPE: TravelerTypeSlug = 'couple';

export default function ExperienciasPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const [dict, setDict] = useState<Awaited<ReturnType<typeof getDictionary>> | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    getDictionary(locale).then(setDict);
    setMounted(true);
  }, [locale]);

  const [selectedType, setSelectedType] =
    useState<TravelerTypeSlug>(DEFAULT_TYPE);
  const plannerRef = useRef<HTMLDivElement>(null);

  const handleTypeSelect = useCallback((slug: TravelerTypeSlug) => {
    setSelectedType(slug);
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!mounted || !dict) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">
          {locale === 'es' ? 'Cargando...' : 'Loading...'}
        </div>
      </main>
    );
  }

  const exp = dict.experiencias;
  const home = dict.home;

  const dictTypesByKey = Object.fromEntries(
    home.explorationTravelerTypes.map((t) => [t.key, t]),
  );
  const travelerTypes: TravelerType[] = initialTravellerTypes.map((type) => {
    const localized = dictTypesByKey[type.travelType.toLowerCase()];
    return {
      ...type,
      description: localized?.description ?? type.description,
      title: localized?.title ?? type.title,
    };
  });

  const plannerByType = Object.fromEntries(
    Object.entries(TRAVELER_TYPES).map(([slug, data]) => [
      slug,
      data.planner,
    ]),
  ) as Record<TravelerTypeSlug, TypePlannerContent>;

  const planner = plannerByType[selectedType];
  if (!planner) return null;

  return (
    <main className="relative" style={{ scrollBehavior: 'smooth' }}>
      <Hero
        content={exp.hero}
        scrollIndicator
      />

      <Section
        className="overflow-visible pl-4 md:pl-[8%]"
        eyebrow={exp.travelTypeEyebrow}
        id="travel-type-selector"
        subtitle={exp.travelTypeSubtitle}
        title={exp.travelTypeTitle}
      >
        <div className="container mx-auto px-4 md:px-20">
          <TravelerTypesCarousel
            fullViewportWidth
            onSelect={handleTypeSelect}
            selectedTravelType={selectedType}
            travelerTypes={travelerTypes}
          />
        </div>
      </Section>

      <div ref={plannerRef} id="type-planner">
        <TypePlanner
          content={planner}
          fullViewportWidth
          type={selectedType}
        />
      </div>
    </main>
  );
}
