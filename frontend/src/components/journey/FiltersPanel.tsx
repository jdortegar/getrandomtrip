
'use client';

import { useJourneyStore } from "@/store/journeyStore";
import { computeFiltersCost } from "@/lib/pricing";

export default function FiltersPanel() {
    const { filters, logistics, setPartial, basePriceUsd } = useJourneyStore();

    const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
        const newFilters = { ...filters, [key]: value };
        const filtersCostUsd = computeFiltersCost(newFilters, logistics.pax);
        const totalPerPaxUsd = basePriceUsd + (filtersCostUsd / logistics.pax);
        setPartial({ filters: newFilters, filtersCostUsd, totalPerPaxUsd });
    };

    return (
        <div className="mt-4 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">Tu primer filtro opcional es gratis. 2–3 filtros: USD 18 c/u. 4+ filtros: USD 25 c/u.</p>
                <p className="text-xs text-blue-600">Transporte no suma costo (es obligatorio). “Destinos a evitar” cuenta como un filtro total.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Transporte preferencia (obligatorio, sin cargo)</label>
                <div className="flex space-x-2 mt-1">
                    {(['avion', 'bus', 'tren', 'barco'] as const).map(transport => (
                        <button
                            key={transport}
                            onClick={() => handleFilterChange('transport', transport)}
                            className={`px-4 py-2 text-sm rounded-md ${filters.transport === transport ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>
                            {transport.charAt(0).toUpperCase() + transport.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Clima preferencial</label>
                <div className="flex space-x-2 mt-1">
                    {(['indistinto', 'calido', 'frio', 'templado'] as const).map(climate => (
                        <button
                            key={climate}
                            onClick={() => handleFilterChange('climate', climate)}
                            className={`px-4 py-2 text-sm rounded-md ${filters.climate === climate ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>
                            {climate.charAt(0).toUpperCase() + climate.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Tiempo máximo de viaje</label>
                <div className="flex space-x-2 mt-1">
                    {(['sin-limite', '3h', '5h', '8h'] as const).map(time => (
                        <button
                            key={time}
                            onClick={() => handleFilterChange('maxTravelTime', time)}
                            className={`px-4 py-2 text-sm rounded-md ${filters.maxTravelTime === time ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>
                            {time}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Destinos a evitar</label>
                <input
                    type="text"
                    placeholder="Escribe destinos separados por comas"
                    onChange={(e) => handleFilterChange('avoidDestinations', e.target.value.split(',').map(s => s.trim()))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Este conjunto cuenta como 1 filtro opcional, sin importar cuántos destinos elijan.</p>
            </div>
        </div>
    );
}
