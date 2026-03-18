'use client';

import { useEffect, useState } from 'react';
import NightsCalendar from './NightsCalendar';
import StepperNav from './StepperNav';
import CountrySelector from './CountrySelector';
import CitySelector from './CitySelector';
import type { Level } from '@/lib/utils/experiencesData';
import { useQuerySync } from '@/hooks/useQuerySync';
import { useStore } from '@/store/store';

interface LogisticsTabProps {
  level: Level;
}

export default function LogisticsTab({ level }: LogisticsTabProps) {
  const { logistics, setOriginAndResetFilters, setPartial, _originLocked } = useStore();
  const updateQuery = useQuerySync();

  // Local state for form values
  const [countryValue, setCountryValue] = useState(logistics.country || '');
  const [cityValue, setCityValue] = useState(logistics.city || '');

  // Check if origin is locked (came from tripper flow)
  const isOriginLocked = Boolean(_originLocked);

  // Sync local state with store when logistics changes (e.g., when origin is pre-filled)
  useEffect(() => {
    setCountryValue(logistics.country || '');
    setCityValue(logistics.city || '');
  }, [logistics.country, logistics.city]);

  const decPax = () => {
    const currentPax = logistics.pax || 1;
    setPartial({
      logistics: { ...logistics, pax: Math.max(1, currentPax - 1) },
    });
  };

  const incPax = () => {
    const currentPax = logistics.pax || 1;
    setPartial({
      logistics: { ...logistics, pax: Math.min(8, currentPax + 1) },
    });
  };

  // Handle country change
  const handleCountryChange = (value: string) => {
    if (isOriginLocked) return; // Prevent changes when locked
    setCountryValue(value);
    setCityValue('');
    setOriginAndResetFilters(value, '');
    updateQuery({ avoidDestinations: undefined });
  };

  // Handle city change
  const handleCityChange = (value: string) => {
    if (isOriginLocked) return; // Prevent changes when locked
    setCityValue(value);
    setOriginAndResetFilters(logistics.country ?? '', value);
    updateQuery({ avoidDestinations: undefined });
  };

  return (
    <div className="space-y-6" data-testid="logistics-tab">
      <div className="rt-container py-6">
        <p className="text-center text-gray-600 italic text-lg ">
          Elegí país y ciudad de salida, cantidad de días y la fecha de inicio.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-left mb-1">
            País de Salida
          </label>
          <CountrySelector
            disabled={isOriginLocked}
            onChange={handleCountryChange}
            placeholder="País de salida"
            value={countryValue}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-left mb-1">
            Ciudad de Salida
          </label>
          <CitySelector
            countryValue={countryValue}
            disabled={isOriginLocked}
            onChange={handleCityChange}
            placeholder="Ciudad de salida"
            value={cityValue}
          />
        </div>
      </div>

      <NightsCalendar level={level} />
    </div>
  );
}
