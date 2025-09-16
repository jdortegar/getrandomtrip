'use client';

import React, { Suspense } from 'react';
import EventFinder from '@/components/EventFinder';
import FooterLanding from '@/components/layout/FooterLanding';
import HomeInfoCarousel from '@/components/landing/HomeInfoCarousel';
import Hero from '@/components/landing/Hero';
import ExplorationPageContent from '@/components/landing/ExplorationPageContent';
import BlogSection from '@/components/landing/BlogSection';
import ReadyForAdventureSection from '@/components/landing/ReadyForAdventureSection';
import PremiumLoader from '@/components/ui/feedback/PremiumLoader';

// --- Main Home Page Component ---
export default function HomePage() {
  return (
    <main className="bg-[#111827] text-white">
      <Hero />

      <HomeInfoCarousel />
      <section id="inspiration" className="scroll-mt-28">
        <BlogSection />
      </section>
      <Suspense
        fallback={<PremiumLoader message="Preparando tu aventura..." />}
      >
        <ExplorationPageContent />
      </Suspense>
      <EventFinder />
      <ReadyForAdventureSection />
      <FooterLanding />
    </main>
  );
}
