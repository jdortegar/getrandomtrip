'use client';

import React from 'react';
import EventFinder from '@/components/EventFinder';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/Hero';
import { ExplorationSection } from '@/components/landing/exploration';
import ReadyForAdventureSection from '@/components/ReadyForAdventureSection';
import Blog from '@/components/Blog';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';
import { HERO_CONTENT } from '@/lib/data/home-hero';

// --- Main Home Page Component ---
export default function HomePage() {
  return (
    <main style={{ scrollBehavior: 'smooth' }}>
      <Hero content={HERO_CONTENT} scrollIndicator />
      <HomeInfo />
      <ReadyForAdventureSection />
      <ExplorationSection />
      <Blog content={BLOG_CONSTANTS} id="home-blog" />
      <EventFinder />
    </main>
  );
}
