// Ruta: frontend/src/app/journey/reveal/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

function RevealContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  
  const [revealData, setRevealData] = useState<{ destination: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setError("ID de reserva no encontrado.");
      setIsLoading(false);
      return;
    }

    const fetchReveal = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/reveal`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al obtener la revelación.');
        }
        setRevealData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReveal();
  }, [bookingId]);

  if (isLoading) {
    return <div className="bg-[#111827] h-screen text-white flex items-center justify-center">Descifrando tu destino...</div>;
  }

  return (
    <main className="bg-[#111827] text-white min-h-screen flex items-center justify-center text-center p-8">
      <div className="max-w-2xl">
        {error ? (
          <div>
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>La Aventura Aún Reposa</h1>
            <p className="text-lg text-gray-300">{error}</p>
            <p className="text-sm text-gray-500 mt-4">Vuelve aquí 48 horas antes de tu viaje para descubrir el secreto.</p>
          </div>
        ) : (
          <div>
            <p className="text-xl text-gray-400 mb-4">Tu próximo destino es...</p>
            <h1 className="text-7xl md:text-9xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {revealData?.destination}
            </h1>
            <p className="text-lg text-gray-300 mt-8">Prepara tus maletas. Los detalles completos, incluyendo vuelos y hotel, han sido enviados a tu correo electrónico.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RevealPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <RevealContent />
        </Suspense>
    );
}
