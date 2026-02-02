'use client';

import { useMemo, useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';
import CitySelector from '@/components/journey/CitySelector';
import CountrySelector from '@/components/journey/CountrySelector';
import { JourneyDatesPicker } from '@/components/journey/JourneyDatesPicker';
import { JourneySectionCard } from '@/components/journey/JourneySectionCard';
import { reverseGeocodeGoogle } from '@/lib/geocode';
import { getCountryByCode } from '@/lib/data/shared/countries';
import { cn } from '@/lib/utils';

function getMaxNightsFromPlannerLevel(level: {
  features?: Array<{ description?: string; title?: string }>;
}) {
  const duration = level.features?.find((f) => f.title === 'Duración');
  const text = duration?.description || '';
  const match = text.match(/(\d+)/);
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isFinite(parsed) ? parsed : 2;
}

interface JourneyDetailsStepProps {
  experienceLevel?: {
    features?: Array<{ description?: string; title?: string }>;
    name: string;
  } | null;
  openSectionId: string;
  onNavigateToAddons: () => void;
  onNavigateToFilters: () => void;
  onOpenSection: (id: string) => void;
  onOriginCityChange: (value: string) => void;
  onOriginCountryChange: (value: string) => void;
  onStartDateChange: (startDate: string | undefined) => void;
  onNightsChange: (nights: number) => void;
  originCity: string;
  originCountry: string;
  startDate: string | undefined;
  nights: number;
}

export function JourneyDetailsStep({
  experienceLevel,
  nights,
  onNavigateToAddons,
  onNavigateToFilters,
  onNightsChange,
  onOpenSection,
  onOriginCityChange,
  onOriginCountryChange,
  onStartDateChange,
  openSectionId,
  originCity,
  originCountry,
  startDate,
}: JourneyDetailsStepProps) {
  const [isLocating, setIsLocating] = useState(false);
  const isOriginOpen = openSectionId === 'origin';
  const isDatesOpen = openSectionId === 'dates';

  const maxNights = useMemo(() => {
    if (!experienceLevel) return 2;
    return getMaxNightsFromPlannerLevel(experienceLevel);
  }, [experienceLevel]);

  const handleLocateMe = async () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { country, label } = await reverseGeocodeGoogle(
            pos.coords.latitude,
            pos.coords.longitude,
          );

          const countryName = country ? getCountryByCode(country)?.name : null;
          if (countryName) onOriginCountryChange(countryName);

          const maybeCity = label?.split(',')?.[0]?.trim();
          if (maybeCity) onOriginCityChange(maybeCity);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const originSummary =
    originCountry && originCity
      ? `${originCountry} · ${originCity}`
      : originCountry || originCity || 'Elegí país y ciudad de salida';

  const datesSummary =
    startDate && nights
      ? `${startDate} · ${nights + 1} días`
      : 'Elegí cantidad de días y fecha de inicio';

  return (
    <div className="space-y-6">
      <JourneySectionCard
        actionLabel={isOriginOpen ? 'Cerrar' : 'Editar'}
        description="Elegí dónde empieza tu aventura"
        isOpen={isOriginOpen}
        onActionClick={() => onOpenSection(isOriginOpen ? '' : 'origin')}
        title="Origen"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              País de salida
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 z-10" />
              <CountrySelector
                className="pl-11 rounded-full"
                onChange={(value) => {
                  onOriginCountryChange(value);
                  if (originCity) onOriginCityChange('');
                }}
                placeholder="Escribir país de salida"
                size="lg"
                value={originCountry}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ciudad de salida
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 z-10" />
              <CitySelector
                className="pl-11 rounded-full"
                countryValue={originCountry}
                onChange={onOriginCityChange}
                placeholder="Escribir ciudad de salida"
                size="lg"
                value={originCity}
              />
            </div>
          </div>
        </div>

        <button
          className={cn(
            'mt-6 flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-left',
            'hover:bg-gray-100 transition-colors',
          )}
          disabled={isLocating}
          onClick={handleLocateMe}
          type="button"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
            <LocateFixed className="h-6 w-6 text-gray-700" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-medium text-gray-900">
              {isLocating ? 'Buscando…' : 'Localizarme'}
            </span>
            <span className="text-sm text-gray-500">Buscar mi locación</span>
          </span>
        </button>
      </JourneySectionCard>

      <JourneySectionCard
        actionLabel={isDatesOpen ? 'Cerrar' : 'Agregar fechas'}
        description={datesSummary}
        isOpen={isDatesOpen}
        onActionClick={() => onOpenSection(isDatesOpen ? '' : 'dates')}
        title="Fechas"
      >
        <JourneyDatesPicker
          maxNights={maxNights}
          nights={nights}
          onNightsChange={onNightsChange}
          onStartDateChange={onStartDateChange}
          startDate={startDate}
        />
      </JourneySectionCard>

      <JourneySectionCard
        actionLabel="Filtrar"
        description="Horarios preferidos, clima, destinos a evitar, tiempo máximo de viaje, tipo de transporte."
        onActionClick={onNavigateToFilters}
        title="Filtros"
      />

      <JourneySectionCard
        actionLabel="Add-ons"
        description="Elegí tus add-ons."
        onActionClick={onNavigateToAddons}
        title="Extras"
      />
    </div>
  );
}
