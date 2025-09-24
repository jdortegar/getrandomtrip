'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ReadyForAdventureSection: React.FC = () => {
  return (
    <section
      aria-label="Listo para la aventura"
      className="call-to-action-background h-[320px] text-white py-16 px-4 md:px-8 relative"
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-primary" />

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-caveat">
          ¿Listo para la aventura?
        </h2>
        <p className="text-lg md:text-lg mb-6 max-w-md font-jost">
          Tu próximo recuerdo inolvidable está a un solo click de distancia. No
          lo pienses más.
        </p>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="px-8"
          aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
        >
          <Link href="/?tab=By%20Traveller#start-your-journey-anchor">
            RANDOMTRIPME!
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default ReadyForAdventureSection;
