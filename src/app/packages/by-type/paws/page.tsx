import type { Metadata } from 'next';
import { getTravellerData } from '@/lib/travellerTypes';
import type { CSSProperties } from 'react';

import PawsHero from '@/components/by-type/paws/PawsHero';
import PawsPlanner from '@/components/by-type/paws/PawsPlanner';
import PawsInspiration from '@/components/by-type/paws/PawsInspiration';
import PawsTestimonials from '@/components/by-type/paws/PawsTestimonials';
import FooterLanding from '@/components/layout/FooterLanding';

export const metadata: Metadata = {
  title: 'Paws | Randomtrip',
};

export default function PawsPage() {
  const type = 'paws';
  const data = getTravellerData(type) ?? {
    slug: type,
    heroTitle: 'Ruta con Alma',
    subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
    palette: {
      primary: '#FFF',
      secondary: '#0A2240',
      accent: '#F2C53D',
      text: '#212121',
    },
    images: { hero: '' },
  };

  const style = {
    '--rt-primary': data.palette.primary,
    '--rt-secondary': data.palette.secondary,
    '--rt-accent': data.palette.accent,
    '--rt-text': data.palette.text,
  } as CSSProperties;

  return (
    <main style={style}>
      <PawsHero />
      <PawsPlanner />
      <PawsInspiration />
      <PawsTestimonials />
      <FooterLanding />
    </main>
  );
}
