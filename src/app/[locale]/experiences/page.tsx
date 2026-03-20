'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import TypePlanner from '@/components/by-type/TypePlanner';
import { TravelerTypesCarousel } from '@/components/landing/exploration/TravelerTypesCarousel';
import Section from '@/components/layout/Section';
import en from '@/dictionaries/en.json';
import es from '@/dictionaries/es.json';
import { getTravelerType } from '@/lib/data/traveler-types';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';
import { hasLocale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { getPlannerContentForType, getPlannerLevelsForType } from '@/lib/utils/experiencesData';

export default function ExperiencesPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = (locale === 'en' ? en : es) as Dictionary;
  const exp = dict.experiences;
  const home = dict.home;

  const travelerTypes = home.exploration.travelerTypes;
  const [selectedTypeTraveler, setSelectedTypeTraveler] =
    useState<TravelerTypeSlug>(
      (travelerTypes[0].key as TravelerTypeSlug) ?? 'couple',
    );

  function handleSelectTypeTraveler(type: TravelerTypeSlug) {
    setSelectedTypeTraveler(type);
    document
      .getElementById('type-planner')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const typeData = getTravelerType(selectedTypeTraveler, locale);
  const planner = typeData?.planner;

  return (
    <main className="relative" style={{ scrollBehavior: 'smooth' }}>
      <Hero content={exp.hero} scrollIndicator />

      <Section
        eyebrow={exp.travelTypeEyebrow}
        id="travel-type-selector"
        subtitle={exp.travelTypeSubtitle}
        title={exp.travelTypeTitle}
      >
        <div className="container mx-auto px-4 md:px-20">
          <TravelerTypesCarousel
            fullViewportWidth
            hideOverflow={false}
            localizedTravelerTypes={travelerTypes}
            onSelect={handleSelectTypeTraveler}
            selectedTravelType={selectedTypeTraveler}
          />
        </div>
      </Section>
      <TypePlanner
        content={getPlannerContentForType(selectedTypeTraveler, locale)}
        itemsPerView={3}
        hideOverflow={false} 
        type={selectedTypeTraveler}
      />
    </main>
  );
}
