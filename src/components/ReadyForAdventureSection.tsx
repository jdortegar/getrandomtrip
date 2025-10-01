'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Section from './layout/Section';

const ReadyForAdventureSection: React.FC = () => {
  return (
    <Section
      title={'¿Listo para la aventura?'}
      subtitle={
        'Tu próximo recuerdo inolvidable está a un solo click de distancia. No lo pienses más.'
      }
      variant="dark"
    >
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
    </Section>
  );
};

export default ReadyForAdventureSection;
