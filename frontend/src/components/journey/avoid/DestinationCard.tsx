'use client';
import { useJourneyStore } from '@/store/journeyStore';
import type { AvoidSuggestion } from '@/data/avoid-suggestions';
import { Check } from 'lucide-react';

export default function DestinationCard({ suggestion }: { suggestion: AvoidSuggestion }) {
  const { filters, setPartial } = useJourneyStore();
  const selected = filters.avoidDestinations || [];
  const isSelected = selected.some((n) => n.toLowerCase() === suggestion.name.toLowerCase());

  const toggle = () => {
    let next = [...selected];
    if (isSelected) {
      next = next.filter((n) => n.toLowerCase() !== suggestion.name.toLowerCase());
    }
    else {
      if (next.length >= 15) return; // límite duro
      next.push(suggestion.name);
    }
    setPartial({ filters: { ...filters, avoidDestinations: next } });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isSelected}
      className={`relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-neutral-200 bg-white aspect-[4/5] text-left group ${isSelected ? 'ring-2 ring-[--terracotta,#D97E4A]' : ''}`}
    >
      {/* Imagen si existe, si no fallback */}
      {suggestion.image ? (
        <img
          src={suggestion.image}
          alt={suggestion.name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}

      {/* Fallback gradient (si la imagen no cargó o no existe, queda visible) */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-400" />

      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

      {/* Nombre */}
      <div className="absolute bottom-2 left-2 right-2 text-white font-semibold drop-shadow">
        {suggestion.name}
      </div>

      {/* Seleccionado */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-[--terracotta,#D97E4A] text-white flex items-center justify-center shadow">
          <Check size={16} />
        </div>
      )}
    </button>
  );
}