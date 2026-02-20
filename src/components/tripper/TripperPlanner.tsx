'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CountryFlag from '@/components/common/CountryFlag';

import Section from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import {
  TRAVELLER_TYPE_OPTIONS,
  TRAVELLER_TYPE_MAP,
  TYPE_LABELS,
} from '@/lib/constants/traveller-types';
import { getTravelerType } from '@/lib/data/traveler-types';

type Props = {
  tripperData: {
    id: string;
    name: string;
    slug: string;
    commission: number;
    availableTypes: string[];
    destinations?: string[];
    interests?: string[];
  };
  tripperPackagesByType?: Record<string, Record<string, any[]>>;
};

export default function TripperPlanner({
  tripperData,
  tripperPackagesByType = {},
}: Props) {
  // PLAN DATA
  const [planData, setPlanData] = useState<{
    origin: {
      city: string;
      country: string;
    } | null;
    travellerType: string | null;
  } | null>(null);

  // Get all data from planData for consistent state management
  const travellerType = planData?.travellerType || null;

  const sectionRef = useRef<HTMLDivElement>(null);
  const firstName =
    tripperData.name?.split(' ')[0] || tripperData.name || 'este tripper';
  const availableTypes = tripperData.availableTypes || [];

  // Países visitados: from prop or unique countries from packages
  const visitedCountries = useMemo(() => {
    if (
      tripperData.destinations &&
      Array.isArray(tripperData.destinations) &&
      tripperData.destinations.length > 0
    ) {
      return tripperData.destinations;
    }
    const countries = new Set<string>();
    Object.values(tripperPackagesByType).forEach((byLevel) => {
      Object.values(byLevel).forEach((pkgs: any[]) => {
        pkgs.forEach((p) => {
          if (p?.destinationCountry) countries.add(p.destinationCountry);
        });
      });
    });
    return Array.from(countries);
  }, [tripperData.destinations, tripperPackagesByType]);

  // Áreas de expertise: from prop or from availableTypes labels
  const expertiseAreas = useMemo(() => {
    if (
      tripperData.interests &&
      Array.isArray(tripperData.interests) &&
      tripperData.interests.length > 0
    ) {
      return tripperData.interests;
    }
    return availableTypes.map((t) => TYPE_LABELS[t] || t).filter(Boolean);
  }, [tripperData.interests, availableTypes]);

  // Filter by tripper's available types
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

  return (
    <>
      <Section
        className="py-20"
        fullWidth={true}
        id="planner-section"
        subtitle={`${tripperData.name} se especializa en crear experiencias inolvidables. Sigue estos pasos para empezar a construir tu próximo gran viaje.`}
        title={`Planificá tu Randomtrip con ${firstName}`}
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
          {/* Two columns: Países visitados | Áreas de expertise */}
          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col items-center">
              <h3 className="font-barlow-condensed text-center text-xl font-bold uppercase tracking-wide text-neutral-700">
                Países visitados
              </h3>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {visitedCountries.length > 0 ? (
                  visitedCountries.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-1.5 text-sm text-neutral-500"
                    >
                      <CountryFlag
                        className="shrink-0"
                        country={country}
                        title={country}
                      />
                      <span className="uppercase">{country}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-neutral-400">—</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center border-neutral-200 md:items-start md:border-l md:pl-12">
              <h3 className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-neutral-700">
                Áreas de expertise
              </h3>
              <ul className="mt-3 list-inside list-disc space-y-1 text-left text-sm text-neutral-500">
                {expertiseAreas.length > 0 ? (
                  expertiseAreas.map((area) => (
                    <li key={area} className="uppercase">
                      {area}
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </div>
          </div>

          <Button
            className="mt-20"
            onClick={scrollPlanner}
            size="lg"
            variant="pill"
          >
            Get Randomtrip con {firstName}
          </Button>
        </div>
      </Section>
    </>
  );
}
