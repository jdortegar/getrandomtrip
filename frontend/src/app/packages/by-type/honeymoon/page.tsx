// frontend/src/app/packages/by-type/honeymoon/page.tsx
import type { Metadata } from 'next';
import HoneymoonHero from '@/components/by-type/honeymoon/HoneymoonHero';
import HoneymoonPlanner from '@/components/by-type/honeymoon/HoneymoonPlanner';
import HoneymoonInspiration from '@/components/by-type/honeymoon/HoneymoonInspiration';
import HoneymoonTestimonials from '@/components/by-type/honeymoon/HoneymoonTestimonials';
import FooterLanding from '@/components/layout/FooterLanding';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Luna de Miel | Randomtrip',
  description:
    'El after más épico empieza después del sí. Diseñamos la sorpresa; ustedes la viven.',
  icons: {
    icon: '/assets/icons/favicon-32x32.png',
  },
  openGraph: {
    title: 'Luna de Miel | Randomtrip',
    description:
      'La luna de miel no es un destino, es el primer capítulo. Inspirada en ustedes, diseñada por nosotros.',
    url: '/packages/by-type/honeymoon',
    siteName: 'Randomtrip',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luna de Miel | Randomtrip',
    description:
      'El comienzo invisible que nadie más verá. Sorpresa bien diseñada.',
  },
};

export default function Page() {
  return (
    <>
      {/* Sección 1: Hero */}
      <HoneymoonHero />

      {/* Sección 2: Planner (2 tabs) */}
      <HoneymoonPlanner />

      {/* Sección 3: Blog / Inspiración */}
      <HoneymoonInspiration />

      {/* Sección 4: Opiniones */}
      <HoneymoonTestimonials />

      {/* Footer común de landings */}
      <FooterLanding />
    </>
  );
}
