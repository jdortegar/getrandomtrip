'use client';

import React from 'react';
import Section from '@/components/layout/Section';
import TopTrippersGridComponent from '@/components/tripper/TopTrippersGrid';
import HeaderHero from '@/components/journey/HeaderHero';

export default function TrippersPage() {
  return (
    <main className="min-h-screen bg-white">
      <HeaderHero
        className="!min-h-[50vh]"
        description="Explora perfiles de viajeros expertos que curan experiencias auténticas y memorables."
        subtitle="NUESTROS TRIPPERS"
        title="Nuestros Trippers"
        videoSrc="/videos/trippers-hero.mp4"
      />

      {/* Main Content */}
      <Section className="py-20" fullWidth={false} id="trippers-grid">
        <TopTrippersGridComponent />
      </Section>
    </main>
  );
}
