'use client';

import React from 'react';
import Section from '@/components/layout/Section';
import TopTrippersGridComponent from '@/components/tripper/TopTrippersGrid';
import Hero from '@/components/Hero';

export default function TrippersPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero
        content={{
          title: 'Nuestros Trippers',
          subtitle:
            'Explora perfiles de viajeros expertos que curan experiencias auténticas y memorables',
          videoSrc: '/videos/trippers-hero.mp4',
          fallbackImage: '/images/bg/trippers-hero.jpg',
        }}
        id="trippers-hero"
        className="!h-[50vh]"
      />

      {/* Main Content */}
      <Section className="py-20" fullWidth={false} id="trippers-grid">
        <TopTrippersGridComponent />
      </Section>
    </main>
  );
}
