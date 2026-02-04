'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { searchCountries } from '@/lib/data/shared/countries';
import { cn } from '@/lib/utils';

interface Country {
  name: string;
  code: string;
}

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function CountrySelector({
  value,
  onChange,
  placeholder = 'País de salida',
  className = '',
  disabled = false,
  onKeyDown,
  size = 'md',
}: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Search countries from local data
  const fetchCountries = useCallback((query: string) => {
    if (query.length < 2) {
      setCountries([]);
      return;
    }

    setLoading(true);
    try {
      const results = searchCountries(query);
      setCountries(results.slice(0, 10));
    } catch (error) {
      console.error('Error searching countries:', error);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search for countries
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCountries(value);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [value, fetchCountries]);

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

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    onChange(country.name);
    setOpen(false);
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
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full -mt-px bg-white border border-gray-300 border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="animate-spin rounded-full h-4 w-4" />
            </div>
          ) : countries.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              {value.length < 2
                ? 'Escribe al menos 2 caracteres...'
                : 'No se encontraron países.'}
            </div>
          ) : (
            countries.map((country) => (
              <button
                key={country.code}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleCountrySelect(country)}
              >
                {country.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
