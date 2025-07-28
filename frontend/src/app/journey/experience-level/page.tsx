'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Datos de los niveles de experiencia, basados en el documento de flujo de usuario
const experienceLevels = [
  {
    name: 'Essenza',
    tagline: 'Lo esencial con estilo',
    price: 350,
    dbKey: 'Essenza',
    description: 'Hasta 2 noches, alojamiento midscale y guía esencial del destino.',
  },
  {
    name: 'Modo Explora',
    tagline: 'Viaje activo y flexible',
    price: 500,
    dbKey: 'ModoExplora',
    description: 'Hasta 3 noches, transporte multimodal y una guía curada "Decode".',
  },
  {
    name: 'Explora+',
    tagline: 'Más capas, más detalles',
    price: 850,
    dbKey: 'Explora_',
    description: 'Hasta 4 noches, alojamiento upscale y 1 experiencia curada.',
  },
  {
    name: 'Bivouac',
    tagline: 'Curaduría que se siente artesanal',
    price: 1200,
    dbKey: 'Bivouac',
    description: 'Hasta 5 noches, hotel de diseño/boutique y 1 experiencia premium.',
  },
  {
    name: 'Atelier Getaway',
    tagline: 'Distinción, sin esfuerzo',
    price: 1800, // Precio base para "Desde $1,200", podría ser dinámico
    dbKey: 'AtelierGetaway',
    description: 'Noches personalizables, alojamiento de lujo y 2+ experiencias premium.',
  },
];

function ExperienceLevelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const handleLevelSelect = async (level: { dbKey: string; price: number }) => {
    if (!bookingId) {
      console.error('No se encontró el bookingId');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceLevel: level.dbKey,
          basePrice: level.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló la actualización del nivel de experiencia');
      }

      // Redirigimos al siguiente paso: Configuración Básica
      router.push(`/journey/basic-config?bookingId=${bookingId}`);

    } catch (error) {
      console.error('Error al seleccionar el nivel:', error);
    }
  };

  return (
    <main className="bg-[#111827] text-white min-h-screen p-8 md:p-16">
      <div className="max-w-5xl mx-auto text-center">
        <h1 
          className="text-5xl md:text-7xl font-bold mb-4" 
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Define tu Aventura
        </h1>
        <p 
          className="text-lg text-gray-300 mb-12"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Cada nivel es una promesa de descubrimiento. Elige la intensidad de tu experiencia.
        </p>
        <div className="space-y-4">
          {experienceLevels.map((level) => (
            <div 
              key={level.dbKey} 
              onClick={() => handleLevelSelect(level)}
              className="bg-gray-800/50 border border-gray-700 p-6 text-left rounded-lg transition-all duration-300 hover:border-[#D4AF37] hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{level.name}</h3>
                  <p className="text-gray-400">{level.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#D4AF37]">${level.price}</p>
                  <p className="text-sm text-gray-500">por persona</p>
                </div>
              </div>
              <p className="mt-4 text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                {level.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// Usamos Suspense para poder usar useSearchParams del lado del cliente
export default function ExperienceLevelPage() {
    return (
        <Suspense fallback={<div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando niveles...</div>}>
            <ExperienceLevelContent />
        </Suspense>
    );
}