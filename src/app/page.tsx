import React from 'react';
import EventFinder from '@/components/EventFinder';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/Hero';
import { ExplorationSection } from '@/components/landing/exploration';
import ReadyForAdventureSection from '@/components/ReadyForAdventureSection';
import Blog from '@/components/Blog';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';
import { HERO_CONTENT } from '@/lib/data/home-hero';
import TrustSignals from '@/components/TrustSignals';
import { getAllTrippers } from '@/lib/db/tripper-queries';

// --- Main Home Page Component ---
export default async function HomePage() {
  const trippers = await getAllTrippers();

  return (
    <main style={{ scrollBehavior: 'smooth' }}>
      <Hero content={HERO_CONTENT} scrollIndicator />
      <HomeInfo />
      {/* <TrustSignals variant="compact" /> */}
      <ExplorationSection trippers={trippers as any} />
      {/* <Blog content={BLOG_CONSTANTS} id="home-blog" /> */}
      {/* <EventFinder /> */}
      {/* <ReadyForAdventureSection /> */}
    </main>
  );
}
