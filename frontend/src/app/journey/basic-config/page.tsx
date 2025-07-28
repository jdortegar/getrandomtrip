'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PrimaryButton from '@/components/PrimaryButton';

function BasicConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  // Estado para manejar los inputs del formulario
  const [originCity, setOriginCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [travelerCount, setTravelerCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingId) {
      setError('Error: No se encontró el ID de la reserva.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originCity: originCity,
          startDate: new Date(startDate).toISOString(), // Convertimos a formato ISO
          travelerCount: Number(travelerCount),
        }),
      });

      if (!response.ok) {
        throw new Error('Falló la actualización de la configuración básica');
      }

      // Redirigimos al siguiente paso: Filtros Premium
      router.push(`/journey/premium-filters?bookingId=${bookingId}`);

    } catch (err) {
      setError('Hubo un problema al guardar tu configuración. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[#111827] text-white min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl mx-auto text-center w-full">
        <h1 
          className="text-5xl md:text-7xl font-bold mb-4" 
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Los Detalles Esenciales
        </h1>
        <p 
          className="text-lg text-gray-300 mb-12"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Cuéntanos un poco más para empezar a dar forma a tu viaje.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Ciudad de Origen */}
          <div>
            <label htmlFor="originCity" className="block text-left text-lg font-medium text-gray-300 mb-2">Ciudad de Origen</label>
            <input
              type="text"
              id="originCity"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
              placeholder="Ej: Buenos Aires, Argentina"
            />
             <p className="text-xs text-gray-500 text-left mt-1">La integración con Google Maps Autocomplete se añadirá después.</p>
          </div>

          {/* Fila para Fecha y Viajeros */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label htmlFor="startDate" className="block text-left text-lg font-medium text-gray-300 mb-2">Fecha de Inicio</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
              />
            </div>
            <div className="w-1/2">
               <label htmlFor="travelerCount" className="block text-left text-lg font-medium text-gray-300 mb-2">Viajeros</label>
              <input
                type="number"
                id="travelerCount"
                value={travelerCount}
                onChange={(e) => setTravelerCount(parseInt(e.target.value, 10))}
                required
                min="1"
                max="10"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>
          
          {error && <p className="text-red-500">{error}</p>}

          <div className="pt-6">
            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Continuar'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function BasicConfigPage() {
    return (
        <Suspense fallback={<div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando configuración...</div>}>
            <BasicConfigContent />
        </Suspense>
    );
}