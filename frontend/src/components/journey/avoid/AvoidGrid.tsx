
'use client';
import { useState } from 'react';
import { useJourneyStore } from '@/store/journeyStore';
import { AVOID_SUGGESTIONS } from '@/data/avoid-suggestions';
import DestinationCard from './DestinationCard';
import AvoidSearchModal from './AvoidSearchModal';

export default function AvoidGrid() {
  const { filters, setPartial } = useJourneyStore();
  const { avoidDestinations } = filters;
  const [isModalOpen, setModalOpen] = useState(false);

  const toggleDestination = (slug: string) => {
    const current = avoidDestinations;
    const newAvoid = current.includes(slug)
      ? current.filter(d => d !== slug)
      : [...current, slug];

    if (newAvoid.length > 15) {
      // Optionally show a toast or message
      return;
    }
    setPartial({ filters: { ...filters, avoidDestinations: newAvoid } });
  };

  const len = avoidDestinations.length;
  const limitReached = len >= 15;

  return (
    <div className="mt-6">
      <h3 className="font-semibold">Destinos a evitar (opcional)</h3>
      <p className="text-sm text-neutral-600">Seleccionados: {len}/15</p>
      {limitReached && <p className="text-sm text-amber-600 mt-1">Llegaste al límite de 15 destinos.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {AVOID_SUGGESTIONS.map(dest => (
          <DestinationCard
            key={dest.slug}
            dest={dest}
            isSelected={avoidDestinations.includes(dest.slug)}
            onToggle={toggleDestination}
          />
        ))}
        <div
          role="button"
          onClick={() => !limitReached && setModalOpen(true)}
          className={`flex items-center justify-center aspect-[4/5] rounded-lg border-2 border-dashed border-neutral-300 text-neutral-500 ${limitReached ? 'opacity-50 cursor-not-allowed' : 'hover:border-terracotta-500 hover:text-terracotta-600'}`}
        >
          <div className="text-center">
            <p className="font-bold text-lg">+</p>
            <p>Buscar destino...</p>
          </div>
        </div>
      </div>

      <AvoidSearchModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
