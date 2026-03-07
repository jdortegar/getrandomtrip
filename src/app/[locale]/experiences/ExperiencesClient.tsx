'use client';

import React, { useState } from 'react';
import TypePlanner from '@/components/by-type/TypePlanner';
import Section from '@/components/layout/Section';
import { TravelerTypesCarousel } from '@/components/landing/exploration/TravelerTypesCarousel';
import { getTravelerType } from '@/lib/data/traveler-types';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';
import type { MarketingDictionary } from '@/lib/types/dictionary';

export interface ExperiencesClientProps {
  experiences: MarketingDictionary['experiences'];
  home: MarketingDictionary['home'];
  locale: string;
}

export default function ExperiencesClient({
  experiences,
  home,
  locale,
}: ExperiencesClientProps) {
  const travelerTypes = home.exploration.travelerTypes;
  const [selectedTypeTraveler, setSelectedTypeTraveler] =
    useState<TravelerTypeSlug>(
      (travelerTypes[0].key as TravelerTypeSlug) ?? 'couple',
    );

  const handleSelectTypeTraveler = (type: TravelerTypeSlug) => {
    setSelectedTypeTraveler(type);
    document
      .getElementById('type-planner')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const typeData =getTravelerType(selectedTypeTraveler, locale)
  const planner = typeData?.planner;

  return (
    <>
      <Section
        eyebrow={experiences.travelTypeEyebrow}
        id="travel-type-selector"
        subtitle={experiences.travelTypeSubtitle}
        title={experiences.travelTypeTitle}
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
          content={planner!}
          fullViewportWidth
          type={selectedTypeTraveler}
          hideOverflow={false}
        />      
    </>
  );
}
