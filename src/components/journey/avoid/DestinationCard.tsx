// frontend/src/components/journey/avoid/DestinationCard.tsx
'use client';

import React from 'react';
import Img from '@/components/common/Img'; // Added import
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@/hooks/useQuerySync';
import { Check } from 'lucide-react';

interface AvoidSuggestion {
  slug: string;
  city: string;
  country: string;
  image: string;
  landmark?: string;
  description?: string;
}

export default function DestinationCard({
  suggestion,
}: {
  suggestion: AvoidSuggestion;
}) {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const selected = React.useMemo(() => {
    const raw = searchParams.get('avoidDestinations');
    return raw
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }, [searchParams]);

  const fullName = `${suggestion.city}, ${suggestion.country}`;
  const isSelected = selected.some(
    (n) =>
      n.toLowerCase() === fullName.toLowerCase() ||
      n.toLowerCase() === suggestion.city.toLowerCase(),
  );

  const toggle = () => {
    let next: string[];
    if (isSelected) {
      next = selected.filter(
        (n) =>
          n.toLowerCase() !== fullName.toLowerCase() &&
          n.toLowerCase() !== suggestion.city.toLowerCase(),
      );
    } else {
      if (selected.length >= 15) return;
      next = [...selected, suggestion.city];
    }
    updateQuery({
      avoidDestinations: next.length > 0 ? next : undefined,
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isSelected}
      className={`relative overflow-hidden rounded-sm shadow-sm ring-1 ring-neutral-200 bg-white aspect-square text-left group cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Fallback (queda debajo por orden) */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-400" />

      {/* Imagen si existe */}
      {suggestion.image ? (
        <Img
          src={suggestion.image}
          alt={suggestion.city}
          className="absolute inset-0 h-full w-full object-cover aspect-square"
          width={300} // Assuming a reasonable default width for aspect-[4/5]
          height={300} // Assuming a reasonable default height for aspect-[4/5]
        />
      ) : null}

      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Nombre y Landmark */}
      <div className="absolute bottom-2 left-2 right-2 text-white drop-shadow flex flex-col">
        <div className="font-semibold text-xl">{suggestion.city}</div>
        <div className="font-semibold text-sm">{suggestion.country}</div>
      </div>

      {/* Indicador seleccionado */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white text-primary flex items-center justify-center shadow">
          <Check size={16} />
        </div>
      )}
    </button>
  );
}
