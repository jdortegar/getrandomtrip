'use client'; // Necesario para usar hooks como `useRouter` y manejar eventos onClick

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Hook para la redirección
import PrimaryButton from '@/components/PrimaryButton';
import TripCard from '@/components/TripCard';

export default function HomePage() {
  const router = useRouter(); // Inicializamos el hook

  const handleStartJourney = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falló la creación de la reserva');
      }

      const data = await response.json();
      const { bookingId } = data;

      // Redirigimos al usuario al siguiente paso, pasando el ID de la reserva
      router.push(`/journey/exploration?bookingId=${bookingId}`);

    } catch (error) {
      console.error('Error al iniciar el viaje:', error);
      // Aquí podríamos mostrar una notificación de error al usuario
    }
  };

  return (
    <main className="bg-[#111827] text-white">
      {/* --- 1. Hero Section --- */}
      <header className="relative h-screen flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop"
            alt="Paisaje evocador de un viaje"
            fill
            style={{ objectFit: 'cover' }}
            className="opacity-40"
            priority // Ayuda a que la imagen principal cargue más rápido
          />
        </div>
        
        <div className="relative z-10 p-4">
          <h1 
            className="text-6xl md:text-8xl font-bold text-white mb-4" 
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Donde termina la rutina, comienza la aventura.
          </h1>
          <p 
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Diseñamos la sorpresa. Odiamos la improvisación. Responde unas preguntas y nos encargaremos del resto. Tu único trabajo es disfrutar del viaje.
          </p>
          <PrimaryButton onClick={handleStartJourney}>
            RandomtripME!
          </PrimaryButton>
        </div>
      </header>
      
      {/* --- 2. Inspiración Section --- */}
      <section className="py-20 px-8">
        <h2 className="text-4xl font-bold text-center mb-12" style={{ fontFamily: 'Playfair Display, serif' }}>Inspiración para tu Próxima Aventura</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <TripCard 
            title="Costas Olvidadas" 
            imageUrl="https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop" // URL Corregida
          />
          <TripCard 
            title="Ciudades con Alma" 
            imageUrl="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2070&auto=format&fit=crop" 
          />
          <TripCard 
            title="Cumbres Silenciosas" 
            imageUrl="https://images.unsplash.com/photo-1589834390005-5d4fb9bf3d32?q=80&w=2070&auto=format&fit=crop" 
          />
        </div>
      </section>
    </main>
  );
}