'use client';

import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Img from '@/components/common/Img';
import { getAvoidCities } from '@/lib/helpers/avoid-cities';
import { getCityImage } from '@/lib/api/unsplash';
import { useQuerySync } from '@/hooks/useQuerySync';
import { useStore } from '@/store/store';
import { cn } from '@/lib/utils';
import AvoidSearchModal from './AvoidSearchModal';
import { Button } from '@/components/ui/Button';

function isCitySelected(selected: string[], cityName: string): boolean {
  const cityLower = cityName.toLowerCase().trim();
  return selected.some((n) => n.toLowerCase().trim() === cityLower);
}

const MAX_SELECTION = 15;

interface Suggestion {
  slug: string;
  city: string;
  country: string;
  image: string;
}

interface AvoidDestinationsGridProps {
  experience?: string;
  originCity: string;
  originCountry: string;
}

export function AvoidDestinationsGrid({
  experience,
  originCity,
  originCountry,
}: AvoidDestinationsGridProps) {
  const { filters, setPartial } = useStore();
  const sync = useQuerySync();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selected = filters.avoidDestinations ?? [];
  const level = experience ?? 'modo-explora';

  useEffect(() => {
    if (!originCountry || !originCity) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const avoidCities = getAvoidCities(originCountry, originCity, level, 6);

    if (avoidCities.length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    Promise.all(
      avoidCities.map(async (city) => {
        const image = await getCityImage(city.name, city.countryCode);
        return {
          slug: city.id,
          city: city.name,
          country: city.country,
          image,
        };
      }),
    )
      .then((list) => {
        if (!cancelled) setSuggestions(list);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originCountry, originCity, level]);

  const removeFromSelection = useCallback(
    (value: string) => {
      const next = selected.filter(
        (n) => n.toLowerCase() !== value.toLowerCase(),
      );
      setPartial({ filters: { ...filters, avoidDestinations: next } });
      sync({ avoidDestinations: next.length ? next : undefined });
    },
    [filters, selected, setPartial, sync],
  );

  const toggle = useCallback(
    (city: string) => {
      const cityNorm = city.trim();
      if (!cityNorm) return;
      const isSelected = isCitySelected(selected, cityNorm);
      let next: string[];
      if (isSelected) {
        next = selected.filter(
          (n) => n.toLowerCase().trim() !== cityNorm.toLowerCase(),
        );
      } else {
        if (selected.length >= MAX_SELECTION) return;
        next = [...selected.filter((n) => !isCitySelected([n], cityNorm)), cityNorm];
      }
      setPartial({ filters: { ...filters, avoidDestinations: next } });
      sync({ avoidDestinations: next.length ? next : undefined });
    },
    [filters, selected, setPartial, sync],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {isLoading ? (
            <div className="col-span-full py-8 text-center text-sm text-gray-500">
              Cargando ciudades...
            </div>
          ) : (
            suggestions.map((d) => {
              const isSelected = isCitySelected(selected, d.city);
              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    'relative overflow-hidden rounded-lg border bg-white text-left shadow-sm transition',
                    isSelected ? 'ring-2 ring-primary' : 'border-gray-200',
                  )}
                  key={d.slug}
                  onClick={() => toggle(d.city)}
                  type="button"
                >
                  <div className="aspect-square w-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-400" />
                    {d.image ? (
                      <Img
                        alt={d.city}
                        className="absolute inset-0 h-full w-full object-cover"
                        height={200}
                        src={d.image}
                        width={200}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col text-white drop-shadow">
                      <span className="font-semibold">{d.city}</span>
                      <span className="text-sm">{d.country}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-primary shadow">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">
            Tus destinos a evitar ({selected.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((value) => (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800',
                )}
                key={value}
              >
                {value}
                <button
                  aria-label={`Quitar ${value}`}
                  className="rounded-full p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromSelection(value);
                  }}
                  type="button"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          className="border border-gray-300 text-sm font-normal normal-case"
          onClick={() => setShowSearchModal(true)}
          variant="secondary"
        >
          Otros destinos a evitar
        </Button>
      </div>

      <AvoidSearchModal
        onClose={() => setShowSearchModal(false)}
        open={showSearchModal}
      />
    </div>
  );
}
