'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import PrimaryButton from '@/components/PrimaryButton';
import { Booking } from '@/types';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <main className="bg-[#111827] text-white min-h-screen flex items-center justify-center text-center p-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          {/* Un ícono de check o similar sería ideal aquí */}
          <svg className="mx-auto h-24 w-24 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 
          className="text-5xl md:text-7xl font-bold mb-4" 
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          ¡Tu aventura está en marcha!
        </h1>
        <p 
          className="text-lg text-gray-300 mb-12"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Hemos recibido la confirmación de tu viaje con el ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{bookingId}</span>.
          <br />
          El secreto mejor guardado del mundo está siendo preparado para ti. Recibirás un correo electrónico con la revelación de tu destino 48 horas antes de la fecha de tu viaje.
        </p>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-12">
            <p className="text-xl text-gray-400 mb-2">LA REVELACIÓN COMIENZA EN:</p>
            <p className="text-4xl font-bold tracking-widest">[Placeholder para el Countdown Timer]</p>
        </div>

        <Link href="/">
          <PrimaryButton onClick={() => {}}>
            Volver a la Página Principal
          </PrimaryButton>
        </Link>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando confirmación...</div>}>
            <ConfirmationContent />
        </Suspense>
    );
}