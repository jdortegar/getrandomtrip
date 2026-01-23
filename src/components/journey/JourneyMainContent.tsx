'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Accordion } from '@/components/ui/accordion';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { TravelerTypesCarousel } from '@/components/landing/exploration/TravelerTypesCarousel';
import TypePlanner from '@/components/by-type/TypePlanner';
import { getTravelerType } from '@/lib/data/traveler-types';
import { TRAVELER_TYPE_LABELS } from '@/lib/data/journey-labels';
import { useQuerySync } from '@/hooks/useQuerySync';
import { cn } from '@/lib/utils';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface JourneyMainContentProps {
  activeTab: string;
  className?: string;
}

export default function JourneyMainContent({
  activeTab,
  className,
}: JourneyMainContentProps) {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();
  const [accordionValue, setAccordionValue] = useState<string>('');

  const travelType = useMemo(() => {
    return searchParams.get('travelType') || undefined;
  }, [searchParams]);

  const experience = useMemo(() => {
    return searchParams.get('experience') || undefined;
  }, [searchParams]);

  const travelerTypeData = useMemo(() => {
    if (!travelType) return null;
    return getTravelerType(travelType);
  }, [travelType]);

  const handleTravelTypeSelect = (slug: string) => {
    updateQuery({ travelType: slug });
    // Auto-close dropdown after selection
    setAccordionValue('');
  };

  const handleExperienceSelect = (levelId: string) => {
    updateQuery({ experience: levelId });
    // Auto-close dropdown after selection
    setAccordionValue('');
  };

  const getTravelTypeLabel = () => {
    if (!travelType) return 'Elegí tu experiencia';
    return TRAVELER_TYPE_LABELS[travelType] || travelType;
  };

  const getExperienceLabel = () => {
    if (!experience || !travelerTypeData) return 'Qué quiero de mi viaje';
    const level = travelerTypeData.planner.levels.find(
      (l) => l.id === experience,
    );
    return level?.name || experience;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'budget':
        return (
          <div>
            <Accordion
              collapsible
              onValueChange={setAccordionValue}
              type="single"
              value={accordionValue}
            >
              <JourneyDropdown
                className="mb-4"
                content={getTravelTypeLabel()}
                label="Tipo de Viaje"
                value="travel-type"
              >
                <TravelerTypesCarousel
                  fullViewportWidth={false}
                  itemsPerView={4}
                  onSelect={handleTravelTypeSelect}
                  selectedTravelType={travelType as TravelerTypeSlug}
                  showArrows={false}
                  classes={{
                    wrapper: 'w-full',
                  }}
                />
              </JourneyDropdown>

              {travelType && travelerTypeData && (
                <JourneyDropdown
                  content={getExperienceLabel()}
                  label="Experiencia"
                  value="experience"
                >
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Selecciona el nivel de experiencia que más se adapte a tu
                      presupuesto y preferencias.
                    </p>
                    <TypePlanner
                      compact
                      content={travelerTypeData.planner}
                      fullViewportWidth={false}
                      onSelect={handleExperienceSelect}
                      selectedLevel={experience}
                      showArrows={false}
                      type={travelType as TravelerTypeSlug}
                      classes={{
                        wrapper: 'w-full px-2',
                      }}
                    />
                  </div>
                </JourneyDropdown>
              )}
            </Accordion>
          </div>
        );
      case 'excuse':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Excusa</h2>
            <p className="text-gray-600">¿Cuál es la razón de tu viaje?</p>
            {/* Placeholder for excuse selection components */}
          </div>
        );
      case 'details':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Detalles y planificación
            </h2>
            <p className="text-gray-600">Configura los detalles de tu viaje.</p>
            {/* Placeholder for details components */}
          </div>
        );
      case 'preferences':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Preferencias y filtros
            </h2>
            <p className="text-gray-600">
              Personaliza tus preferencias de viaje.
            </p>
            {/* Placeholder for preferences components */}
          </div>
        );
      case 'extras':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Extras</h2>
            <p className="text-gray-600">Agrega extras a tu viaje.</p>
            {/* Placeholder for extras components */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex-1 min-h-0', className)}>
      <div className="">{renderContent()}</div>
    </div>
  );
}
