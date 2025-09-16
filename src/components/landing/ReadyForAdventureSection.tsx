'use client';

import React from 'react';
import Link from 'next/link';

const ReadyForAdventureSection: React.FC = () => {
  return (
    <section
      aria-label="Sección final - Listo para la aventura"
      className="call-to-action-background h-[320px] text-white"
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          ¿Listo para la aventura?
        </h2>
        <p className="text-lg md:text-xl mb-6 max-w-md">
          Tu próximo recuerdo inolvidable está a un solo click de distancia. No
          lo pienses más.
        </p>
        <Link
          href="/?tab=By%20Traveller#start-your-journey-anchor"
          aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
          className="bg-[#E59A60] hover:bg-[#d58b50] text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          RANDOMTRIPME!
        </Link>
      </div>
    </section>
  );
};

export default ReadyForAdventureSection;
