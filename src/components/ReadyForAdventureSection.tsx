'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Section from './layout/Section';

const ReadyForAdventureSection: React.FC = () => {
  return (
    <Section
      className="relative min-h-[50vh] overflow-hidden md:min-h-[60vh]"
      subtitle={
        'Tu próximo recuerdo inolvidable está a un solo click de distancia. No lo pienses más.'
      }
      title={'¿Listo para la aventura?'}
      variant="dark"
      backgroundImage="/images/bg/2.jpg"
    >
      <Button asChild size="lg" variant="outline">
        <Link href="#exploration-section" scroll={true}>
          RANDOMTRIPME!
        </Link>
      </Button>
    </Section>
  );
};

export default ReadyForAdventureSection;
