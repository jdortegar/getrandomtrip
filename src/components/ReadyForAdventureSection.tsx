'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Section from './layout/Section';

const ReadyForAdventureSection: React.FC = () => {
  return (
    <Section
      background="/images/bg-playa-mexico.jpg"
      className="relative min-h-[50vh] overflow-hidden md:min-h-[60vh]"
      subtitle={
        'Tu próximo recuerdo inolvidable está a un solo click de distancia. No lo pienses más.'
      }
      title={'¿Listo para la aventura?'}
      variant="dark"
    >
      <Button
        aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
        asChild
        className="px-8 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 md:px-12"
        size="default"
        variant="outline"
      >
        <Link href="#exploration-section" scroll={true}>
          RANDOMTRIP-ME!
        </Link>
      </Button>
    </Section>
  );
};

export default ReadyForAdventureSection;
