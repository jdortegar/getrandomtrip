
'use client';

import { useJourneyStore } from "@/store/journeyStore";
import { getMaxNights, validateNights } from "@/lib/levels";
import { useState } from "react";

export default function LogisticsForm() {
    const { logistics, setPartial, level } = useJourneyStore();
    const [error, setError] = useState<string | null>(null);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newLogistics = { ...logistics, [name]: value };

        if (newLogistics.startDate && newLogistics.endDate && level) {
            const startDate = new Date(newLogistics.startDate);
            const endDate = new Date(newLogistics.endDate);
            if (!validateNights(startDate, endDate, level)) {
                const maxNights = getMaxNights(level);
                setError(`Con ${level} se permiten hasta ${maxNights} noches. Ajusten las fechas.`);
            } else {
                setError(null);
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                newLogistics.nights = diffDays;
            }
        }

        setPartial({ logistics: newLogistics });
    };

    return (
        <div className="mt-4 space-y-4">
            <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700">Origen (ciudad/aeropuerto)</label>
                <input
                    type="text"
                    id="origin"
                    placeholder="Ej.: Buenos Aires (EZE)"
                    value={logistics.origin || ''}
                    onChange={(e) => setPartial({ logistics: { ...logistics, origin: e.target.value } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Usaremos este punto para calcular rutas y tiempos.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Entrada</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={logistics.startDate || ''}
                        onChange={handleDateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Salida</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={logistics.endDate || ''}
                        onChange={handleDateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {logistics.nights > 0 && <p className="text-sm text-gray-600">Duración: {logistics.nights} noches</p>}
            <div>
                <label htmlFor="pax" className="block text-sm font-medium text-gray-700">Viajeros</label>
                <input
                    type="number"
                    id="pax"
                    min="1"
                    value={logistics.pax || 2}
                    onChange={(e) => setPartial({ logistics: { ...logistics, pax: parseInt(e.target.value, 10) } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Precio por persona. Pueden editarlo en cualquier momento.</p>
            </div>
        </div>
    );
}
