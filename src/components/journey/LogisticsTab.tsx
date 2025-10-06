'use client';

import { useState } from 'react';
import NightsCalendar from './NightsCalendar';
import StepperNav from './StepperNav';
import CountrySelector from './CountrySelector';
import CitySelector from './CitySelector';
import { Level } from '@/lib/data/levels';
import { useStore } from '@/store/store';

interface LogisticsTabProps {
  level: Level;
}

export default function LogisticsTab({ level }: LogisticsTabProps) {
  const { logistics, setPartial } = useStore();

  // Local state for form values
  const [countryValue, setCountryValue] = useState(logistics.country || '');
  const [cityValue, setCityValue] = useState(logistics.city || '');

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
    setCountryValue(value);
    setPartial({
      logistics: {
        ...logistics,
        country: value,
        city: '', // Clear city when country changes
      },
    });
    // Clear city when country changes
    if (value !== countryValue) {
      setCityValue('');
    }
  };

  // Handle city change
  const handleCityChange = (value: string) => {
    setCityValue(value);
    setPartial({
      logistics: {
        ...logistics,
        city: value,
      },
    });
  };

  return (
    <div className="font-jost space-y-6" data-testid="logistics-tab">
      <div className="max-w-7xl mx-auto py-6">
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
            value={countryValue}
            onChange={handleCountryChange}
            placeholder="País de salida"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-left mb-1">
            Ciudad de Salida
          </label>
          <CitySelector
            value={cityValue}
            onChange={handleCityChange}
            countryValue={countryValue}
            placeholder="Ciudad de salida"
          />
        </div>
      </div>

      <NightsCalendar level={level} />
    </div>
  );
}
