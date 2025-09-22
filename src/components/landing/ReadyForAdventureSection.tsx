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
      <div className="absolute inset-0 bg-primary/40" />

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-caveat">
          ¿Listo para la aventura?
        </h2>
        <p className="text-lg md:text-lg mb-6 max-w-md font-jost">
          Tu próximo recuerdo inolvidable está a un solo click de distancia. No
          lo pienses más.
        </p>
        <Link
          href="/?tab=By%20Traveller#start-your-journey-anchor"
          aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8"
        >
          RANDOMTRIPME!
        </Link>
      </div>
    </section>
  );
};

export default ReadyForAdventureSection;
