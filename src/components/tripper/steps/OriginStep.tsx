'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
      exit={{ opacity: 0, y: -20 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 md:text-3xl">
          ¿Desde dónde viajas?
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-gray-600">
          {tripperName} diseñará tu experiencia desde tu ciudad de origen
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex gap-4 justify-center">
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-gray-700">
              País de salida
            </label>
            <CountrySelector
              className="w-full"
              onChange={handleCountryChange}
              placeholder="Selecciona tu país"
              value={countryValue}
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-gray-700">
              Ciudad de salida
            </label>
            <CitySelector
              className="w-full"
              countryValue={countryValue}
              onChange={handleCityChange}
              placeholder="Selecciona tu ciudad"
              value={cityValue}
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
    </motion.div>
  );
}
