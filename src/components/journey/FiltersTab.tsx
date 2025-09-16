
'use client';
import { useJourneyStore, countOptionalFilters } from '@/store/journeyStore';
import { useRouter } from 'next/navigation';
import AvoidGrid from './avoid/AvoidGrid';

const calculateFilterCost = (filterCount: number): number => {
  if (filterCount <= 1) return 0;
  if (filterCount <= 3) return (filterCount - 1) * 18;
  return (1 * 0) + (2 * 18) + (filterCount - 3) * 25;
};

export default function FiltersTab() {
  const router = useRouter();
  const { filters, setPartial, basePriceUsd, logistics } = useJourneyStore();

  const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    const newFilters = { ...filters, [key]: value };

    const optionalFilterCount = countOptionalFilters(newFilters);
    const newFilterCost = calculateFilterCost(optionalFilterCount);
    const newTotalPerPax = basePriceUsd + (newFilterCost / logistics.pax);

    setPartial({
      filters: newFilters,
      filtersCostUsd: newFilterCost,
      totalPerPaxUsd: newTotalPerPax,
    });
  };

  const handleContinue = () => {
    // TODO: Change to router.push('/journey/add-ons') when the page exists
    console.log("Continuing to add-ons...");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Filtros Premium (Opcional)</h2>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2 text-sm text-blue-800">
          <p>Tu primer filtro opcional es gratis. 2–3 filtros: USD 18 c/u. 4+ filtros: USD 25 c/u.</p>
          <p className="font-semibold mt-1">Transporte no suma costo (es obligatorio). ‘Destinos a evitar’ cuenta como un filtro total.</p>
        </div>
      </div>

      {/* Other filters will go here */}

      <AvoidGrid />

      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          className="btn btn-primary bg-terracotta-600 hover:bg-terracotta-700 text-white"
        >
          Continuar a Add-ons
        </button>
      </div>
    </div>
  );
}
