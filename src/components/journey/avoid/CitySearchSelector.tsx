'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { searchCities, type AvoidCity } from '@/lib/helpers/avoid-cities';
import { ChevronDown } from 'lucide-react';

interface CitySearchSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (city: AvoidCity) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

export default function CitySearchSelector({
  value,
  onChange,
  onSelect,
  onKeyDown,
  className = '',
}: CitySearchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AvoidCity[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search cities when query changes
  useEffect(() => {
    if (value.length >= 2) {
      const cities = searchCities(value, 10);
      setResults(cities);
      setIsOpen(cities.length > 0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: AvoidCity) => {
    const cityFullName = `${city.name}, ${city.country}`;
    onChange(cityFullName);
    setIsOpen(false);
    onSelect?.(city);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Buscar ciudad..."
          className="pr-10"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex flex-col"
            >
              <span className="font-medium text-neutral-900">{city.name}</span>
              <span className="text-xs text-neutral-600">{city.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
