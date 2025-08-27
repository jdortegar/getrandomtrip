'use client';
import { useJourneyStore } from '@/store/journeyStore';

export default function SummaryCard() {
  const { displayPrice, filtersCostUsd, totalPerPaxUsd, logistics } = useJourneyStore();

  const totalFilterCost = filtersCostUsd * logistics.pax;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border">
      <h3 className="text-xl font-bold mb-4">Resumen del Viaje</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Precio base por persona</span>
          <span className="font-semibold">{displayPrice}</span>
        </div>
        <div className="flex justify-between">
          <span>Filtros Premium</span>
          <span className="font-semibold">{totalFilterCost > 0 ? `USD ${totalFilterCost.toFixed(2)}` : 'Gratis'}</span>
        </div>
        <hr className="my-3" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total por persona</span>
          <span>{`USD ${totalPerPaxUsd.toFixed(2)}`}</span>
        </div>
      </div>
    </div>
  );
}