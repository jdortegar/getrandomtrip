import type { Metadata } from 'next';
import React from 'react';

import GroupHero from '@/components/by-type/group/GroupHero';
import GroupPlanner from '@/components/by-type/group/GroupPlanner';
import GroupInspiration from '@/components/by-type/group/GroupInspiration';
import GroupTestimonials from '@/components/by-type/group/GroupTestimonials';
import FooterLanding from '@/components/layout/FooterLanding';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'En Grupo | Randomtrip',
  description:
    'Viajes en grupo que unen historias. Diseñamos escapadas para equipos, amigos y comunidades: logística sin fricción y experiencias que conectan.',
  icons: {
    icon: '/assets/icons/favicon-32x32.png',
  },
  openGraph: {
    title: 'En Grupo | Randomtrip',
    description:
      'Viajes en grupo que unen historias. Diseñamos escapadas para equipos, amigos y comunidades.',
    url: '/packages/by-type/group',
    siteName: 'Randomtrip',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'En Grupo | Randomtrip',
    description:
      'Viajes en grupo que unen historias. Diseñamos escapadas para equipos, amigos y comunidades.',
  },
};

export default function GroupPage() {
  return (
    <main className="relative">
      {/* Sección 1: Hero + chips + CTAs */}
      <GroupHero />

      {/* Sección 2: Wizard con tabs */}
      <GroupPlanner />

      {/* Sección 3: Blog / Inspiración */}
      <GroupInspiration />

      {/* Sección 4: Testimonios */}
      <GroupTestimonials />

      <FooterLanding />
    </main>
  );
}
