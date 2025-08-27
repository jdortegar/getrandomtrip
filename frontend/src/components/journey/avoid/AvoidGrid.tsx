'use client';
import { useState } from 'react';
import DestinationCard from './DestinationCard';
import { AVOID_SUGGESTIONS } from '@/data/avoid-suggestions';
import AvoidSearchModal from './AvoidSearchModal';

export default function AvoidGrid() {
  const [showSearch, setShowSearch] = useState(false);
  const first12 = AVOID_SUGGESTIONS.slice(0, 12);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h3 className="text-lg font-semibold">Destinos a evitar (opcional)</h3>
        <div className="text-sm text-neutral-500">Seleccioná hasta 15</div>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-neutral-200 p-4">
        {/* Grid 3 filas x 4 col (si está contraído) */}
        <div className="grid grid-cols-4 gap-4 max-w-[960px]">
          {first12.map(d => <DestinationCard key={d.slug} suggestion={d} />)}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
          >
            Otros destinos a evitar
          </button>
        </div>
      </div>

      {/* Modal buscador */}
      <AvoidSearchModal open={showSearch} onClose={() => setShowSearch(false)} />
    </section>
  );
}
