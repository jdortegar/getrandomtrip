'use client';
import { useJourneyStore } from '@/store/journeyStore';
import { countOptionalFilters } from '@/store/journeyStore';

export default function SummaryCard(){
  const { displayPrice, basePriceUsd, logistics, filters, filtersCostUsd, totalPerPaxUsd, activeTab, setPartial } = useJourneyStore();

  const pax = logistics.pax || 1;
  // Recalcular simple aquí si tu versión anterior no lo hace:
  const optional = countOptionalFilters(filters);
  let perFilter = 0;
  if (optional >= 2 && optional <= 3) perFilter = 18;
  if (optional >= 4) perFilter = 25;
  const filtersCost = Math.max(0, optional - 1) * perFilter * pax;
  const totalPerPax = basePriceUsd + (filtersCost / pax || 0);

  return (
    <div className="rounded-2xl bg-white/95 text-neutral-900 ring-1 ring-neutral-200 shadow-sm p-4">
      <h4 className="font-semibold mb-3">Resumen del Viaje</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span>Precio base por persona</span><span>{displayPrice || `USD ${basePriceUsd.toFixed(0)}`}</span></div>
        <div className="flex justify-between"><span>Filtros Premium</span><span>{`USD ${filtersCost.toFixed(2)}`}</span></div>
        <div className="border-t my-2"></div>
        <div className="flex justify-between font-semibold"><span>Total por persona</span><span>{`USD ${totalPerPax.toFixed(2)}`}</span></div>
      </div>

      {activeTab==='preferences' && (
        <button
          type="button"
          onClick={()=>setPartial({ activeTab: 'avoid' })}
          className="mt-4 w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white py-2.5 font-medium"
        >
          Ir a Destinos a evitar
        </button>
      )}
    </div>
  );
}
