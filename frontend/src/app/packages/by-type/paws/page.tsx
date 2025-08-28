import Script from 'next/script';
import type { Metadata } from 'next';
import React from 'react';

import PawsHero from '@/components/by-type/paws/PawsHero';
import PawsPlanner from '@/components/by-type/paws/PawsPlanner';
import PawsInspiration from '@/components/by-type/paws/PawsInspiration';
import PawsTestimonials from '@/components/by-type/paws/PawsTestimonials';
import FooterLanding from '@/components/layout/FooterLanding';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'PAWS© RANDOMTRIP | Viajes con mascotas',
  description:
    'Diseñamos escapadas donde tu mejor amigo de cuatro patas también es protagonista.',
  icons: { icon: '/assets/icons/favicon-32x32.png' },
  openGraph: {
    title: 'PAWS© RANDOMTRIP | Viajes con mascotas',
    description:
      'Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amigo de cuatro patas también es protagonista.',
    url: '/packages/by-type/paws',
    siteName: 'Randomtrip',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAWS© RANDOMTRIP | Viajes con mascotas',
    description:
      'Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amigo de cuatro patas también es protagonista.',
  },
};

export default function PawsPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getrandomtrip.com';

  const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: 'Packages', item: `${base}/packages` },
        { '@type': 'ListItem', position: 3, name: 'By Type', item: `${base}/packages/by-type` },
        { '@type': 'ListItem', position: 4, name: 'PAWS', item: `${base}/packages/by-type/paws` },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${base}/packages/by-type/paws#webpage`,
      url: `${base}/packages/by-type/paws`,
      name: 'PAWS© RANDOMTRIP | Viajes con mascotas',
      inLanguage: 'es',
      isPartOf: { '@id': `${base}/#website` },
      description:
        'Viajar con tu mascota sin estrés: hoteles pet-friendly, actividades al aire libre y logística resuelta.',
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${base}/images/journey-types/paws-card.jpg`,
      },
      breadcrumb: { '@id': `${base}/packages/by-type/paws#breadcrumb` },
    },
  ],
};

  return (
    <main className="relative">
      <PawsHero />

      {/* JSON-LD */}
      <Script id="ld-json-paws" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <PawsPlanner />
      <PawsInspiration />
      <PawsTestimonials />
      <FooterLanding />
    </main>
  );
}