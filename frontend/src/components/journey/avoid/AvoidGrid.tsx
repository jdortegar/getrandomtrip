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
    <section className="space-y-2">
      <div className="flex items-end justify-between">
        <h3 className="text-lg font-semibold">Destinos a evitar (opcional)</h3>
        <div className="text-sm text-neutral-500">Seleccioná hasta 15</div>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-4">
        <div className="grid grid-cols-4 gap-4 max-w-[920px]"> {/* 4 x 4 fijo */}
          {AVOID_SUGGESTIONS.slice(0,15).map((d)=> (
            <DestinationCard key={d.slug} dest={d} isSelected={avoidDestinations.includes(d.slug)} onToggle={toggleDestination} />
          ))}

          {/* Tarjeta 16: buscador */}
          <button
            type="button"
            onClick={()=>setModalOpen(true)}
            className="aspect-[4/5] rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 flex items-center justify-center"
          >
            Buscar destino…
          </button>
        </div>

        {/* nav inferior interno opcional aquí si lo usás */}
      </div>

      <AvoidSearchModal isOpen={isModalOpen} onClose={()=>setModalOpen(false)} />
    </section>
  );
}