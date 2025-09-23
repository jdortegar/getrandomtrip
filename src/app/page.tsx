'use client';

import React, { Suspense } from 'react';
import EventFinder from '@/components/EventFinder';
import FooterLanding from '@/components/layout/FooterLanding';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/landing/Hero';
import { ExplorationSection } from '@/components/landing/exploration';
import ReadyForAdventureSection from '@/components/ReadyForAdventureSection';
import PremiumLoader from '@/components/feedback/PremiumLoader';
import Blog from '@/components/landing/Blog';

// --- Main Home Page Component ---
export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <Hero />
      <HomeInfo />
      <ReadyForAdventureSection />
      <Suspense
        fallback={
          <div className="min-h-[300px] flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <ExplorationSection />
      </Suspense>
      <Blog />
      <EventFinder />
      <FooterLanding />
    </main>
  );
}
