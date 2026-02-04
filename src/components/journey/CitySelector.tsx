'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { getCitiesByCountry } from '@/lib/data/shared/countries';
import { cn } from '@/lib/utils';

interface City {
  name: string;
  country: string;
}

interface CitySelectorProps {
  className?: string;
  countryValue: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onOptionSelect?: () => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  value: string;
}

export default function CitySelector({
  className = '',
  countryValue,
  disabled = false,
  onChange,
  onOptionSelect,
  placeholder = 'Ciudad de salida',
  size = 'md',
  value,
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
    onOptionSelect?.();
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-600" />
        <Input
          autoComplete="off"
          className={cn(
            'border-gray-300 bg-white pl-11 ring-0 focus-visible:ring-0',
            size === 'lg'
              ? 'h-12 text-base'
              : size === 'sm'
                ? 'h-8 text-sm'
                : 'h-10',
            className,
            open && 'rounded-b-none',
          )}
          disabled={disabled || !countryValue}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={
            countryValue ? placeholder : 'Selecciona un país primero'
          }
          type="text"
          value={value}
        />
      </div>

      {open && countryValue && (
        <div className="absolute z-50 w-full -mt-px border border-gray-300 border-t-0 rounded-b-md bg-white shadow-lg max-h-60 overflow-y-auto">
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
