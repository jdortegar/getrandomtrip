'use client';

import React from 'react';
import EventFinder from '@/components/EventFinder';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/landing/Hero';
import { ExplorationSection } from '@/components/landing/exploration';
import ReadyForAdventureSection from '@/components/ReadyForAdventureSection';
import Blog from '@/components/Blog';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';

// --- Main Home Page Component ---
export default function HomePage() {
  const blogData = {
    ...BLOG_CONSTANTS,
    posts: [...BLOG_CONSTANTS.posts],
  };

  return (
    <main className="overflow-hidden">
      <Hero />
      <HomeInfo />
      <ReadyForAdventureSection />

      <ExplorationSection />

      <Blog content={blogData} sectionId="home-blog" />
      <EventFinder />
    </main>
  );
}
