'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PrimaryButton from '@/components/PrimaryButton';
import { Booking } from '@/types';

const filterOptions = [
  { id: 'experience_beach', label: 'Playa / Sol' },
  { id: 'experience_city', label: 'Ciudad / Cultura' },
  { id: 'experience_nature', label: 'Naturaleza / Aventura' },
  { id: 'experience_relax', label: 'Relax / Bienestar' },
  { id: 'climate_warm', label: 'Clima Cálido' },
  { id: 'climate_template', label: 'Clima Templado' },
  { id: 'climate_cold', label: 'Clima Frío' },
];

function PremiumFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      const fetchBooking = async () => {
        const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`);
        if (response.ok) {
          const data = await response.json();
          setBooking(data);
        }
      };
      fetchBooking();
    }
  }, [bookingId]);

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const filtersCost = useMemo(() => {
    if (!booking) return 0;
    const count = selectedFilters.length;
    if (count <= 1) return 0;

    let cost = 0;
    if (count >= 2) cost += 18;
    if (count >= 3) cost += 18;
    if (count >= 4) cost += (count - 3) * 25;

    return cost * booking.travelerCount;
  }, [selectedFilters, booking]);

  const handleSubmit = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          premiumFilters: { selected: selectedFilters },
          filtersCost: filtersCost
        }),
      });
      router.push(`/journey/add-ons?bookingId=${bookingId}`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('No se pudieron guardar los filtros.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[#111827] text-white min-h-screen p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Filtros Premium
        </h1>
        <p className="text-lg text-gray-300 text-center mb-12">
          Afina los contornos de tu aventura. El primer filtro es cortesía nuestra.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filterOptions.map(filter => (
            <button
              key={filter.id}
              data-testid={`premium-${filter.id}`}
              onClick={() => handleFilterToggle(filter.id)}
              className={`p-4 border rounded-lg transition-colors ${
                selectedFilters.includes(filter.id)
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-800/50 rounded-lg text-center">
          <p className="text-gray-400">Costo extra por filtros seleccionados:</p>
          <p data-testid="premium-total" className="text-4xl font-bold text-white">
            ${filtersCost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {selectedFilters.length} filtros para {booking?.travelerCount || 0} viajeros
          </p>
        </div>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <div className="text-center mt-8">
          <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Continuar a Add-ons'}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}

export default function PremiumFiltersPage() {
  return (
    <Suspense fallback={<div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando filtros...</div>}>
      <PremiumFiltersContent />
    </Suspense>
  );
}
