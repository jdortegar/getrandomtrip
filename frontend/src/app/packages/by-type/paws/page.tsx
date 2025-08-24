import type { Metadata } from 'next';
import PawsHero from '@/components/by-type/paws/PawsHero';
import PawsPlanner from '@/components/by-type/paws/PawsPlanner';
import PawsInspiration from '@/components/by-type/paws/PawsInspiration';
import PawsTestimonials from '@/components/by-type/paws/PawsTestimonials';
import FooterLanding from '@/components/layout/FooterLanding';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'PAWS© RANDOMTRIP | Viajes con mascotas',
  description:
    'Diseñamos escapadas donde tu mejor amigo de cuatro patas también es protagonista. Hoteles pet-friendly, actividades al aire libre y momentos pensados para que disfruten juntos.',
  icons: { icon: '/assets/icons/favicon-32x32.png' },
  openGraph: {
    title: 'PAWS© RANDOMTRIP | Viajes con mascotas',
    description:
      'Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amigo de cuatro patas también es protagonista.',
    url: '/packages/by-type/paws',
    siteName: 'Randomtrip',
    images: ['/images/og/paws-og.jpg'], // Asegurar si existe luego
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAWS© RANDOMTRIP | Viajes con mascotas',
    description:
      'Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amigo de cuatro patas también es protagonista.',
  },
};

export default function PawsPage() {
  return (
    <main className="relative">
      <PawsHero />
      <PawsPlanner />
      <PawsInspiration />
      <PawsTestimonials />
      <FooterLanding />
    </main>
  );
}