'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Accordion } from '@/components/ui/accordion';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { TravelerTypesCarousel } from '@/components/landing/exploration/TravelerTypesCarousel';
import { ExcusesCarousel } from '@/components/journey/ExcusesCarousel';
import { RefineDetailsCarousel } from '@/components/journey/RefineDetailsCarousel';
import TypePlanner from '@/components/by-type/TypePlanner';
import { JourneyDetailsStep } from '@/components/journey/JourneyDetailsStep';
import {
  DEFAULT_TRANSPORT_ORDER,
} from '@/components/journey/TransportSelector';
import { JourneyPreferencesStep } from '@/components/journey/JourneyPreferencesStep';
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
  onOpenSection?: (sectionId: string) => void;
  onTabChange?: (tabId: string) => void;
  openSectionId?: string;
}

export default function JourneyMainContent({
  activeTab,
  className,
  onOpenSection,
  onTabChange,
  openSectionId,
}: JourneyMainContentProps) {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();
  const [internalAccordion, setInternalAccordion] = useState<string>('');
  const isControlled =
    openSectionId !== undefined && onOpenSection !== undefined;
  const accordionValue = isControlled
    ? (openSectionId ?? '')
    : internalAccordion;
  const setAccordionValue = isControlled
    ? onOpenSection!
    : setInternalAccordion;

  // Auto-open first section when tab changes
  useEffect(() => {
    if (
      activeTab === 'budget' &&
      accordionValue !== 'travel-type' &&
      accordionValue !== 'experience'
    ) {
      setAccordionValue('travel-type');
    } else if (
      activeTab === 'excuse' &&
      accordionValue !== 'excuse' &&
      accordionValue !== 'refine-details'
    ) {
      setAccordionValue('excuse');
    } else if (
      activeTab === 'details' &&
      accordionValue !== 'addons' &&
      accordionValue !== 'dates' &&
      accordionValue !== 'filters' &&
      accordionValue !== 'origin' &&
      accordionValue !== 'transport'
    ) {
      setAccordionValue('origin');
    } else if (
      activeTab === 'preferences' &&
      accordionValue !== 'filters' &&
      accordionValue !== 'addons'
    ) {
      setAccordionValue('filters');
    }
  }, [activeTab, accordionValue, setAccordionValue]);

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

  const originCountry = useMemo(() => {
    return searchParams.get('originCountry') || '';
  }, [searchParams]);

  const originCity = useMemo(() => {
    return searchParams.get('originCity') || '';
  }, [searchParams]);

  const startDate = useMemo(() => {
    return searchParams.get('startDate') || undefined;
  }, [searchParams]);

  const nights = useMemo(() => {
    const raw = searchParams.get('nights');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const transport = useMemo(() => {
    return searchParams.get('transport') || undefined;
  }, [searchParams]);

  const transportOrder = useMemo(() => {
    const raw = searchParams.get('transportOrder');
    if (!raw) return DEFAULT_TRANSPORT_ORDER;
    const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return ids.length === 4 ? ids : DEFAULT_TRANSPORT_ORDER;
  }, [searchParams]);

  const departPref = useMemo(() => {
    return searchParams.get('departPref') || undefined;
  }, [searchParams]);

  const arrivePref = useMemo(() => {
    return searchParams.get('arrivePref') || undefined;
  }, [searchParams]);

  const maxTravelTime = useMemo(() => {
    return searchParams.get('maxTravelTime') || undefined;
  }, [searchParams]);

  const climate = useMemo(() => {
    return searchParams.get('climate') || undefined;
  }, [searchParams]);

  const addons = useMemo(() => {
    return searchParams.get('addons') || undefined;
  }, [searchParams]);

  const travelerTypeData = useMemo(() => {
    if (!travelType) return null;
    return getTravelerType(travelType);
  }, [travelType]);

  const selectedExperienceLevel = useMemo(() => {
    if (!travelerTypeData || !experience) return null;
    return (
      travelerTypeData.planner.levels.find((l) => l.id === experience) || null
    );
  }, [experience, travelerTypeData]);

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

  const handleOriginCountryChange = (value: string) => {
    updateQuery({
      originCountry: value || undefined,
      originCity: undefined,
    });
  };

  const handleOriginCityChange = (value: string) => {
    updateQuery({
      originCity: value || undefined,
    });
  };

  const handleStartDateChange = (value: string | undefined) => {
    updateQuery({
      startDate: value,
    });
  };

  const handleNightsChange = (value: number) => {
    updateQuery({
      nights: String(value),
    });
  };

  const handleRangeChange = (startDate: string | undefined, nights: number) => {
    updateQuery({
      nights: String(nights),
      startDate: startDate ?? undefined,
    });
  };

  const handleTransportChange = (value: string) => {
    updateQuery({ transport: value });
  };

  const handleTransportOrderChange = (orderedIds: string[]) => {
    updateQuery({
      transport: orderedIds[0],
      transportOrder: orderedIds.join(','),
    });
  };

  const handleDepartPrefChange = (value: string) => {
    updateQuery({ departPref: value });
  };

  const handleArrivePrefChange = (value: string) => {
    updateQuery({ arrivePref: value });
  };

  const handleMaxTravelTimeChange = (value: string) => {
    updateQuery({ maxTravelTime: value });
  };

  const handleClimateChange = (value: string) => {
    updateQuery({ climate: value });
  };

  const handleAddonsChange = (value: string | undefined) => {
    updateQuery({ addons: value });
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
      addons: undefined,
      arrivePref: undefined,
      climate: undefined,
      departPref: undefined,
      experience: undefined,
      excuse: undefined,
      maxTravelTime: undefined,
      nights: undefined,
      originCity: undefined,
      originCountry: undefined,
      refineDetails: undefined,
      startDate: undefined,
      transport: undefined,
      transportOrder: undefined,
      travelType: undefined,
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
      case 'details':
        return originCountry && originCity && startDate && nights;
      case 'preferences':
        return Boolean(transport);
      default:
        return true;
    }
  };

  const handleContinue = () => {
    const nextTab = getNextTab();
    if (nextTab && onTabChange) {
      onTabChange(nextTab);
      if (nextTab === 'details') setAccordionValue('origin');
      if (nextTab === 'preferences') setAccordionValue('filters');
    }
  };

  const hasSelections =
    addons ||
    arrivePref ||
    climate ||
    departPref ||
    experience ||
    excuse ||
    maxTravelTime ||
    originCity ||
    originCountry ||
    refineDetails.length > 0 ||
    startDate ||
    transport ||
    travelType;

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
          <div className="min-w-0 w-full">
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
                          wrapper: 'w-full p-2',
                        }}
                      />
                    </div>
                  </JourneyDropdown>
                )}
            </Accordion>
          </div>
        );
      case 'details':
        if (!travelType || !experience || !excuse) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                Primero completá Presupuesto y Excusa.
              </p>
            </div>
          );
        }

        return (
          <JourneyDetailsStep
            arrivePref={arrivePref}
            climate={climate}
            departPref={departPref}
            experience={experience}
            maxTravelTime={maxTravelTime}
            nights={nights}
            onArrivePrefChange={handleArrivePrefChange}
            onClimateChange={handleClimateChange}
            onDepartPrefChange={handleDepartPrefChange}
            onMaxTravelTimeChange={handleMaxTravelTimeChange}
            onNavigateToAddons={() => {
              if (onTabChange) onTabChange('preferences');
              setAccordionValue('addons');
            }}
            onNightsChange={handleNightsChange}
            onOpenSection={setAccordionValue}
            onOriginCityChange={handleOriginCityChange}
            onOriginCountryChange={handleOriginCountryChange}
            onRangeChange={handleRangeChange}
            onStartDateChange={handleStartDateChange}
            onTransportOrderChange={handleTransportOrderChange}
            openSectionId={accordionValue || 'origin'}
            originCity={originCity}
            originCountry={originCountry}
            startDate={startDate}
            transportOrder={transportOrder}
            travelType={travelType}
          />
        );
      case 'preferences':
        if (!originCountry || !originCity || !startDate) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                Primero completá Origen y Fechas en Detalles y planificación.
              </p>
            </div>
          );
        }

        return (
          <JourneyPreferencesStep
            addons={addons}
            arrivePref={arrivePref}
            climate={climate}
            departPref={departPref}
            maxTravelTime={maxTravelTime}
            onAddonsChange={handleAddonsChange}
            onArrivePrefChange={handleArrivePrefChange}
            onClimateChange={handleClimateChange}
            onDepartPrefChange={handleDepartPrefChange}
            onMaxTravelTimeChange={handleMaxTravelTimeChange}
            onOpenSection={setAccordionValue}
            onTransportChange={handleTransportChange}
            openSectionId={accordionValue || 'filters'}
            transport={transport}
          />
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
