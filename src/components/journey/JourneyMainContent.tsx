'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Accordion } from '@/components/ui/accordion';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { TravelerTypesCarousel } from '@/components/landing/exploration/TravelerTypesCarousel';
import { ExcusesCarousel } from '@/components/journey/ExcusesCarousel';
import { RefineDetailsCarousel } from '@/components/journey/RefineDetailsCarousel';
import TypePlanner from '@/components/by-type/TypePlanner';
import { getTravelerType } from '@/lib/data/traveler-types';
import { TRAVELER_TYPE_LABELS } from '@/lib/data/journey-labels';
import {
  getExcusesByType,
  getExcuseOptions,
} from '@/lib/helpers/excuse-helper';
import { useQuerySync } from '@/hooks/useQuerySync';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface JourneyMainContentProps {
  activeTab: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export default function JourneyMainContent({
  activeTab,
  className,
  onTabChange,
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

  const excuse = useMemo(() => {
    return searchParams.get('excuse') || undefined;
  }, [searchParams]);

  const refineDetails = useMemo(() => {
    const details = searchParams.get('refineDetails');
    if (!details) return [];
    return details.split(',').filter(Boolean);
  }, [searchParams]);

  const travelerTypeData = useMemo(() => {
    if (!travelType) return null;
    return getTravelerType(travelType);
  }, [travelType]);

  const excuses = useMemo(() => {
    if (!travelType) return [];
    return getExcusesByType(travelType);
  }, [travelType]);

  const refineDetailsOptions = useMemo(() => {
    if (!excuse) return [];
    return getExcuseOptions(excuse);
  }, [excuse]);

  const handleTravelTypeSelect = (slug: string) => {
    updateQuery({ travelType: slug });
    // Advance to next dropdown
    setAccordionValue('experience');
  };

  const handleExperienceSelect = (levelId: string) => {
    updateQuery({ experience: levelId });
    // Advance to next tab + first dropdown
    if (onTabChange) onTabChange('excuse');
    setAccordionValue('excuse');
  };

  const handleExcuseSelect = (excuseKey: string) => {
    updateQuery({
      excuse: excuseKey,
      refineDetails: undefined, // Reset refine details when excuse changes
    });
    // Advance to next dropdown
    setAccordionValue('refine-details');
  };

  const handleRefineDetailsSelect = (optionKey: string) => {
    const currentDetails = [...refineDetails];
    const index = currentDetails.indexOf(optionKey);

    if (index > -1) {
      // Remove if already selected
      currentDetails.splice(index, 1);
    } else {
      // Add if not selected
      currentDetails.push(optionKey);
    }

    updateQuery({
      refineDetails:
        currentDetails.length > 0 ? currentDetails.join(',') : undefined,
    });
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

  const getExcuseLabel = () => {
    if (!excuse) return 'Elegí tu excusa';
    const selectedExcuseData = excuses.find((e) => e.key === excuse);
    return selectedExcuseData?.title || excuse;
  };

  const getRefineDetailsLabel = () => {
    if (refineDetails.length === 0) return 'Afinar detalles';
    if (refineDetails.length === 1) {
      const option = refineDetailsOptions.find(
        (o) => o.key === refineDetails[0],
      );
      return option?.label || '1 detalle seleccionado';
    }
    return `${refineDetails.length} detalles seleccionados`;
  };

  const handleClearAll = () => {
    updateQuery({
      travelType: undefined,
      experience: undefined,
      excuse: undefined,
      refineDetails: undefined,
    });
    setAccordionValue('');
    // Reset to first tab
    if (onTabChange) {
      onTabChange('budget');
    }
  };

  const getNextTab = () => {
    const tabs = ['budget', 'excuse', 'details', 'preferences'];
    const currentIndex = tabs.indexOf(activeTab);
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
  };

  const isCurrentStepComplete = () => {
    switch (activeTab) {
      case 'budget':
        return travelType && experience;
      case 'excuse':
        return travelType && experience && excuse;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    const nextTab = getNextTab();
    if (nextTab && onTabChange) {
      onTabChange(nextTab);
    }
  };

  const hasSelections =
    travelType || experience || excuse || refineDetails.length > 0;

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
          <div>
            <Accordion
              collapsible
              onValueChange={setAccordionValue}
              type="single"
              value={accordionValue}
            >
              <JourneyDropdown
                className="mb-4"
                content={getExcuseLabel()}
                label="Excusa"
                value="excuse"
              >
                {travelType && experience ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Toda escapada tiene su “porque sí”. 
                    </p>
                    <ExcusesCarousel
                      excuses={excuses}
                      fullViewportWidth={false}
                      itemsPerView={3}
                      onSelect={handleExcuseSelect}
                      selectedExcuse={excuse}
                      showArrows={false}
                      classes={{
                        wrapper: 'w-full px-2',
                      }}
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">
                      Primero completa el tipo de viaje y la experiencia en la
                      sección Presupuesto.
                    </p>
                  </div>
                )}
              </JourneyDropdown>

              {travelType &&
                experience &&
                excuse &&
                refineDetailsOptions.length > 0 && (
                  <JourneyDropdown
                    className="mb-4"
                    content={getRefineDetailsLabel()}
                    label="Afinar detalles"
                    value="refine-details"
                  >
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Cuando lo desconocido se convierte en tu mejor compañía.
                      </p>
                      <RefineDetailsCarousel
                        fullViewportWidth={false}
                        itemsPerView={3}
                        onSelect={handleRefineDetailsSelect}
                        options={refineDetailsOptions}
                        selectedOptions={refineDetails}
                        showArrows={false}
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

  const nextTab = getNextTab();
  const canContinue = isCurrentStepComplete() && nextTab;

  return (
    <div className={cn('flex-1 min-h-0 flex flex-col', className)}>
      <div className="flex-1">{renderContent()}</div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-gray-200">
        <button
          className="text-gray-900 underline hover:no-underline text-sm font-medium"
          onClick={handleClearAll}
          type="button"
        >
          Borrar todo
        </button>

        {canContinue && (
          <Button
            variant="default"
            onClick={handleContinue}
            size="md"
            className="text-sm font-normal normal-case"
          >
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
