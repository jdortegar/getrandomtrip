'use client';

import { useMemo, useState } from 'react';
import { Accordion } from '@/components/ui/accordion';
import CitySelector from '@/components/journey/CitySelector';
import CountrySelector from '@/components/journey/CountrySelector';
import { JourneyDatesPicker } from '@/components/journey/JourneyDatesPicker';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { JourneyFiltersForm } from '@/components/journey/JourneyFiltersForm';
import TransportSelector, {
  TRANSPORT_OPTIONS,
} from '@/components/journey/TransportSelector';
import { getTravelerType } from '@/lib/data/traveler-types';
import { getCountryByCode } from '@/lib/data/shared/countries';
import { reverseGeocodeGoogle } from '@/lib/geocode';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';

const DEFAULT_MAX_NIGHTS = 2;

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatDatesRange(startDate: string, nights: number): string {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  if (startMonth === endMonth) {
    return `${MONTH_NAMES_ES[startMonth]}, del ${startDay} al ${endDay}`;
  }
  return `del ${startDay} de ${MONTH_NAMES_ES[startMonth]} al ${endDay} de ${MONTH_NAMES_ES[endMonth]}`;
}

interface JourneyDetailsStepProps {
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
  maxTravelTime: string | undefined;
  nights: number;
  onArrivePrefChange: (value: string) => void;
  onClimateChange: (value: string) => void;
  onDepartPrefChange: (value: string) => void;
  onMaxTravelTimeChange: (value: string) => void;
  onNavigateToAddons: () => void;
  onNightsChange: (nights: number) => void;
  onOpenSection: (id: string) => void;
  onOriginCityChange: (value: string) => void;
  onOriginCountryChange: (value: string) => void;
  onRangeChange?: (startDate: string | undefined, nights: number) => void;
  onStartDateChange: (startDate: string | undefined) => void;
  onTransportOrderChange: (orderedIds: string[]) => void;
  openSectionId: string;
  originCity: string;
  originCountry: string;
  startDate: string | undefined;
  transportOrder: string[];
  travelType?: string;
}

export function JourneyDetailsStep({
  arrivePref,
  climate,
  departPref,
  experience,
  maxTravelTime,
  nights,
  onArrivePrefChange,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onNavigateToAddons,
  onNightsChange,
  onOpenSection,
  onOriginCityChange,
  onOriginCountryChange,
  onRangeChange,
  onStartDateChange,
  onTransportOrderChange,
  openSectionId,
  originCity,
  originCountry,
  startDate,
  transportOrder,
  travelType,
}: JourneyDetailsStepProps) {
  const [isLocating, setIsLocating] = useState(false);

  const maxNights = useMemo(() => {
    if (!travelType || !experience) return DEFAULT_MAX_NIGHTS;
    const travelerTypeData = getTravelerType(travelType);
    const level = travelerTypeData?.planner?.levels?.find(
      (l) => l.id === experience,
    );
    return level?.maxNights ?? DEFAULT_MAX_NIGHTS;
  }, [experience, travelType]);

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
      ? formatDatesRange(startDate, nights)
      : 'Elegí cantidad de días y fecha de inicio';

  const transportSummary =
    transportOrder.length > 0
      ? `${TRANSPORT_OPTIONS.find((o) => o.id === transportOrder[0])?.label ?? transportOrder[0]} *`
      : 'Definí el orden de preferencia arrastrando';

  const filtersSummary = useMemo(() => {
    const parts: string[] = [];
    if (departPref && departPref !== 'indistinto') {
      const opt = FILTER_OPTIONS.departPref.options.find(
        (o) => o.key === departPref,
      );
      if (opt) parts.push(`Salida: ${opt.label}`);
    }
    if (arrivePref && arrivePref !== 'indistinto') {
      const opt = FILTER_OPTIONS.arrivePref.options.find(
        (o) => o.key === arrivePref,
      );
      if (opt) parts.push(`Llegada: ${opt.label}`);
    }
    if (maxTravelTime && maxTravelTime !== 'sin-limite') {
      const opt = FILTER_OPTIONS.maxTravelTime.options.find(
        (o) => o.key === maxTravelTime,
      );
      if (opt) parts.push(`Tiempo de viaje: ${opt.label}`);
    }
    if (climate && climate !== 'indistinto') {
      const opt = FILTER_OPTIONS.climate.options.find((o) => o.key === climate);
      if (opt) parts.push(`Clima: ${opt.label}`);
    }
    return parts.length > 0
      ? parts.join(', ')
      : 'Horarios, clima, tiempo, destinos a evitar';
  }, [arrivePref, climate, departPref, maxTravelTime]);

  return (
    <Accordion
      collapsible
      onValueChange={onOpenSection}
      type="single"
      value={openSectionId}
    >
      <div className="space-y-4">
        <JourneyDropdown content={originSummary} label="Origen" value="origin">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label className="text-base font-bold text-gray-700">
                País de salida
              </label>
              <CountrySelector
                onChange={(value) => {
                  onOriginCountryChange(value);
                  if (originCity) onOriginCityChange('');
                }}
                placeholder="Escribir país de salida"
                size="lg"
                value={originCountry}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label className="text-base font-bold text-gray-700">
                Ciudad de salida
              </label>
              <CitySelector
                countryValue={originCountry}
                onChange={onOriginCityChange}
                onOptionSelect={() => onOpenSection('dates')}
                placeholder="Escribir ciudad de salida"
                size="lg"
                value={originCity}
              />
            </div>
          </div>
        </JourneyDropdown>

        <JourneyDropdown content={datesSummary} label="Fechas" value="dates">
          <JourneyDatesPicker
            maxNights={maxNights}
            nights={nights}
            onConfirm={() => onOpenSection('filters')}
            onNightsChange={onNightsChange}
            onRangeChange={onRangeChange}
            onStartDateChange={onStartDateChange}
            startDate={startDate}
          />
        </JourneyDropdown>
        <JourneyDropdown
          content={transportSummary}
          label="Transporte: Orden de preferencia"
          value="transport"
        >
          <TransportSelector
            onChange={onTransportOrderChange}
            value={transportOrder}
          />
        </JourneyDropdown>

        <JourneyDropdown
          content={filtersSummary}
          label="Filtros"
          value="filters"
        >
          <JourneyFiltersForm
            arrivePref={arrivePref}
            climate={climate}
            departPref={departPref}
            experience={experience}
            maxTravelTime={maxTravelTime}
            onArrivePrefChange={onArrivePrefChange}
            onClear={() => {
              onArrivePrefChange('indistinto');
              onClimateChange('indistinto');
              onDepartPrefChange('indistinto');
              onMaxTravelTimeChange('sin-limite');
            }}
            onClimateChange={onClimateChange}
            onDepartPrefChange={onDepartPrefChange}
            onMaxTravelTimeChange={onMaxTravelTimeChange}
            onSave={() => onOpenSection('addons')}
            originCity={originCity}
            originCountry={originCountry}
          />
        </JourneyDropdown>

        <JourneyDropdown
          content="Elegí tus add-ons."
          label="Extras"
          value="addons"
        >
          <button
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
            onClick={onNavigateToAddons}
            type="button"
          >
            Add-ons
          </button>
        </JourneyDropdown>
      </div>
    </Accordion>
  );
}
