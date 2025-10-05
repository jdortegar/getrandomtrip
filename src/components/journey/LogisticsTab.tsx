'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import NightsCalendar from './NightsCalendar';
import StepperNav from './StepperNav';
import CountrySelector from './CountrySelector';
import CitySelector from './CitySelector';
import { Level } from '@/lib/data/levels';

interface LogisticsTabProps {
  level: Level;
}

export default function LogisticsTab({ level }: LogisticsTabProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const watchedValues = watch();

  // Local state for form values
  const [countryValue, setCountryValue] = useState(watchedValues.country || '');
  const [cityValue, setCityValue] = useState(watchedValues.city || '');

  const decPax = () => {
    const currentPax = watchedValues.pax || 1;
    setValue('pax', Math.max(1, currentPax - 1));
  };

  const incPax = () => {
    const currentPax = watchedValues.pax || 1;
    setValue('pax', Math.min(8, currentPax + 1));
  };

  const countryOk = Boolean(watchedValues.country?.trim());
  const cityOk = Boolean(watchedValues.city?.trim());
  const dateOk = Boolean(watchedValues.startDate?.trim());
  const paxOk = (watchedValues.pax ?? 0) >= 1;

  const canContinue = countryOk && cityOk && dateOk && paxOk;

  // Handle country change
  const handleCountryChange = (value: string) => {
    setCountryValue(value);
    setValue('country', value);
    // Clear city when country changes
    if (value !== countryValue) {
      setCityValue('');
      setValue('city', '');
    }
  };

  // Handle city change
  const handleCityChange = (value: string) => {
    setCityValue(value);
    setValue('city', value);
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
      {/* <div>
    //     <label className="block text-sm font-medium mb-2">Viajeros</label>
    //     <div className="inline-flex items-center gap-4">
    //       <button
    //         type="button"
    //         onClick={decPax}
    //         className="h-8 w-8 rounded-full border border-neutral-600 flex items-center justify-center"
    //         aria-label="Disminuir viajeros"
    //         disabled={(logistics.pax ?? 1) <= 1}
    //       >
    //         −
    //       </button>
    //       <span className="min-w-[2ch] text-center">{logistics.pax ?? 1}</span>
    //       <button
    //         type="button"
    //         onClick={incPax}
    //         className="h-8 w-8 rounded-full border border-neutral-600 flex items-center justify-center"
    //         aria-label="Aumentar viajeros"
    //         disabled={(logistics.pax ?? 1) >= 8}
    //       >
    //         +
    //       </button>
    //     </div>
    //     <p className="mt-1 text-xs text-neutral-400">Precio por persona.</p>
    //   </div> */}
      {/* Calendario + Noches */}

      <NightsCalendar level={level} />

      <StepperNav />
    </div>
  );
}
