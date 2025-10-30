'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CountrySelector from '@/components/journey/CountrySelector';
import CitySelector from '@/components/journey/CitySelector';

interface OriginStepProps {
  origin: {
    city: string;
    country: string;
  } | null;
  handlePlanData: (origin: { city: string; country: string } | null) => void;
  onContinue: () => void;
  tripperName: string;
}

export default function OriginStep({
  origin,
  handlePlanData,
  onContinue,
  tripperName,
}: OriginStepProps) {
  const [countryValue, setCountryValue] = useState(origin?.country || '');
  const [cityValue, setCityValue] = useState(origin?.city || '');

  const handleCountryChange = (country: string) => {
    setCountryValue(country);
    handlePlanData({ country, city: cityValue });
  };

  const handleCityChange = (city: string) => {
    setCityValue(city);
    handlePlanData({ country: countryValue, city });
  };

  const canContinue = countryValue && cityValue;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative">
      <div className="space-y-8">
        <div className="text-center mb-8 relative">
          <h3 className="text-xl font-semibold text-neutral-900">
            ¿Desde dónde viajas?
          </h3>
          <p className="mt-2 text-sm text-neutral-800 max-w-3xl mx-auto">
            {tripperName} diseñará tu experiencia desde tu ciudad de origen
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex gap-4 justify-center w-full">
            <div className="space-y-2 text-left w-full">
              <label className="text-sm font-medium text-gray-700">
                País de salida
              </label>
              <CountrySelector
                className="w-full"
                onChange={handleCountryChange}
                placeholder="Selecciona tu país"
                value={countryValue}
                size="lg"
              />
            </div>

            <div className="space-y-2 text-left w-full">
              <label className="text-sm font-medium text-gray-700">
                Ciudad de salida
              </label>
              <CitySelector
                className="w-full"
                countryValue={countryValue}
                onChange={handleCityChange}
                placeholder="Selecciona tu ciudad"
                value={cityValue}
                size="lg"
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              disabled={!canContinue}
              onClick={() => {
                onContinue();
              }}
              size="lg"
            >
              Continuar →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
