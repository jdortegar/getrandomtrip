'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PrimaryButton from '@/components/PrimaryButton';
import { Booking } from '@/types';

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      fetch(`http://localhost:3001/api/bookings/${bookingId}`)
        .then(res => {
          if (!res.ok) throw new Error("No se pudo cargar el resumen de tu viaje.");
          return res.json();
        })
        .then(data => setBooking(data))
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [bookingId]);

  const handleConfirmAndPay = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });

      if (!response.ok) {
        throw new Error('Hubo un problema al confirmar tu pago.');
      }
      
      // La redirección debe ocurrir DESPUÉS de que la API responda
      router.push(`/journey/confirmation?bookingId=${bookingId}`);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false); // Aseguramos que el loading se detenga en caso de error
    }
    // No ponemos setIsLoading(false) aquí para que la página navegue
  };

  if (isLoading) return <div className="bg-[#111827] h-screen text-white flex items-center justify-center">Generando el resumen de tu aventura...</div>;
  if (error) return <div className="bg-[#111827] h-screen text-white flex items-center justify-center">{error}</div>;
  if (!booking) return null;

  return (
    <main className="bg-[#111827] text-white min-h-screen p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Tu Aventura Está Lista</h1>
        <p className="text-lg text-gray-300 text-center mb-12">Solo queda un paso más. Revisa que todos los detalles de tu próximo viaje sorpresa sean correctos.</p>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-2">Tu Experiencia</h2>
            <p><strong>Nivel:</strong> {booking.experienceLevel}</p>
            <p><strong>Tipo de Viaje:</strong> {booking.travelType}</p>
            <p><strong>Origen:</strong> {booking.originCity}</p>
            <p><strong>Viajeros:</strong> {booking.travelerCount}</p>
          </div>
          
          <div className="border-t border-gray-700 pt-6">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-2">Resumen de Costos</h2>
            <div className="space-y-2">
              <div className="flex justify-between"><p>Precio Base:</p> <p>${booking.basePrice?.toFixed(2)}</p></div>
              <div className="flex justify-between"><p>Costo Filtros:</p> <p>${booking.filtersCost?.toFixed(2)}</p></div>
              <div className="flex justify-between"><p>Costo Add-ons:</p> <p>${booking.addonsCost?.toFixed(2)}</p></div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-600 mt-2 pt-2"><p>Precio Final:</p> <p>${booking.totalPrice?.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-10">
          <PrimaryButton onClick={handleConfirmAndPay} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Confirmar y Pagar'}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}

export default function SummaryPage() {
    return (
        <Suspense fallback={<div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando resumen...</div>}>
            <SummaryContent />
        </Suspense>
    );
}