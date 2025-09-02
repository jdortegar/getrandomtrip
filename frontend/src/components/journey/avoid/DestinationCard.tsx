// frontend/src/components/journey/avoid/DestinationCard.tsx
'use client';

import React from 'react';
import { useJourneyStore } from '@/store/journeyStore';
import type { AvoidSuggestion } from '@/data/avoid-suggestions';
import { Check } from 'lucide-react';
import { useQuerySync } from '@/hooks/useQuerySync';

export default function DestinationCard({ suggestion }: { suggestion: AvoidSuggestion }) {
  const { filters, setPartial } = useJourneyStore();
  const sync = useQuerySync();

  const selected = filters.avoidDestinations ?? [];
  const isSelected = selected.some(
    (n) => n.toLowerCase() === suggestion.name.toLowerCase()
  );

  const toggle = () => {
    let next = selected;
    if (isSelected) {
      next = selected.filter((n) => n.toLowerCase() !== suggestion.name.toLowerCase());
    } else {
      if (selected.length >= 15) return; // límite duro
      next = [...selected, suggestion.name];
    }

    // Actualiza store
    setPartial({ filters: { ...filters, avoidDestinations: next } });

    // Sincroniza URL para que el hero muestre los chips correctos
    // (si tu hook acepta arrays, podés pasar `next`; si no, usar join)
    sync({ avoidDestinations: next.join(',') });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isSelected}
      className={`relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-neutral-200 bg-white aspect-[4/5] text-left group ${
        isSelected ? 'ring-2 ring-[--terracotta,#D97E4A]' : ''
      }`}
    >
      {/* Fallback (queda debajo por orden) */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-400" />

      {/* Imagen si existe */}
      {suggestion.image ? (
        <img
          src={suggestion.image}
          alt={suggestion.name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            // si falla, ocultamos la imagen y se ve el fallback de atrás
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}

      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

      {/* Nombre */}
      <div className="absolute bottom-2 left-2 right-2 text-white font-semibold drop-shadow">
        {suggestion.name}
      </div>

      {/* Indicador seleccionado */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-[--terracotta,#D97E4A] text-white flex items-center justify-center shadow">
          <Check size={16} />
        </div>
      )}
    </button>
  );
}