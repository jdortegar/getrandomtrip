// frontend/src/components/journey/LogisticsForm.tsx
'use client';

import { useStore } from '@/store/store';
import { getMaxNights, validateNights } from '@/lib/levels';
import { useState } from 'react';

export default function LogisticsForm() {
  const { logistics, setPartial, level } = useStore();
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newLogistics = { ...logistics, [name]: value } as typeof logistics;

    if (newLogistics.startDate && newLogistics.endDate && level) {
      const startISO = newLogistics.startDate; // string ISO
      const endISO = newLogistics.endDate; // string ISO

      // valida con util que acepta string | Date
      if (!validateNights(startISO, endISO, level)) {
        const maxNights = getMaxNights(level);
        setError(
          `Con ${level} se permiten hasta ${
            maxNights === 'custom' ? '∞' : maxNights
          } noches. Ajusten las fechas.`,
        );
      } else {
        setError(null);
        // recalcular noches en base a las ISO
        const start = new Date(startISO);
        const end = new Date(endISO);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.max(
          1,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
        );
        newLogistics.nights = diffDays;
      }
    }

    setPartial({ logistics: newLogistics });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Origen -> usamos city.name para no romper el tipo Logistics */}
      <div>
        <label
          htmlFor="origin"
          className="block text-sm font-medium text-gray-700"
        >
          Origen (ciudad/aeropuerto)
        </label>
        <input
          type="text"
          id="origin"
          placeholder="Ej.: Buenos Aires (EZE)"
          value={logistics.city ?? ''}
          onChange={(e) =>
            setPartial({
              logistics: {
                ...logistics,
                city: e.target.value,
              },
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Usaremos este punto para calcular rutas y tiempos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Entrada
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={
              logistics.startDate
                ? new Date(logistics.startDate).toISOString().slice(0, 10)
                : ''
            }
            onChange={handleDateChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            Salida
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={
              logistics.endDate
                ? new Date(logistics.endDate).toISOString().slice(0, 10)
                : ''
            }
            onChange={handleDateChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {logistics.nights > 0 && (
        <p className="text-sm text-gray-600">
          Duración: {logistics.nights} noches
        </p>
      )}

      <div>
        <label
          htmlFor="pax"
          className="block text-sm font-medium text-gray-700"
        >
          Viajeros
        </label>
        <input
          type="number"
          id="pax"
          min="1"
          value={logistics.pax || 2}
          onChange={(e) =>
            setPartial({
              logistics: {
                ...logistics,
                pax: parseInt(e.target.value, 10) || 1,
              },
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Precio por persona.</p>
      </div>
    </div>
  );
}
