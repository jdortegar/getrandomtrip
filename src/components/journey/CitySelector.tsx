'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { getCitiesByCountry } from '@/lib/data/countries';

interface City {
  name: string;
  country: string;
}

interface CitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  countryValue: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CitySelector({
  value,
  onChange,
  countryValue,
  placeholder = 'Ciudad de salida',
  className = '',
  disabled = false,
}: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Search cities from local data
  const fetchCities = useCallback(
    (query: string) => {
      if (query.length < 2) {
        setCities([]);
        return;
      }

      if (!countryValue) {
        setCities([{ name: 'Selecciona un país primero', country: '' }]);
        return;
      }

      setLoading(true);
      try {
        const countryCities = getCitiesByCountry(countryValue);
        const filteredCities = countryCities
          .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10)
          .map((city) => ({
            name: city,
            country: countryValue,
          }));

        setCities(filteredCities);
      } catch (error) {
        console.error('Error searching cities:', error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    },
    [countryValue],
  );

  // Debounced search for cities
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCities(value);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [value, fetchCities]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle city selection
  const handleCitySelect = (city: City) => {
    if (city.name === 'Selecciona un país primero') {
      return;
    }
    onChange(city.name);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        type="text"
        placeholder={countryValue ? placeholder : 'Selecciona un país primero'}
        disabled={disabled || !countryValue}
        autoComplete="off"
        className={`bg-white border-gray-300 ring-0 focus-visible:ring-0 ${className}`}
      />

      {open && countryValue && (
        <div className="absolute z-50 w-full -mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto border-t-0 rounded-t-none">
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="animate-spin rounded-full h-4 w-4" />
            </div>
          ) : cities.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              {value.length < 2
                ? 'Escribe al menos 2 caracteres...'
                : 'No se encontraron ciudades.'}
            </div>
          ) : (
            cities.map((city) => (
              <button
                key={`${city.name}-${city.country}`}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleCitySelect(city)}
                disabled={city.name === 'Selecciona un país primero'}
              >
                <div className="font-medium">{city.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
