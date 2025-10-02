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
  const blogData = {
    ...BLOG_CONSTANTS,
    posts: [...BLOG_CONSTANTS.posts],
  };

  return (
    <main style={{ scrollBehavior: 'smooth' }}>
      <Hero content={HERO_CONTENT} id="home-hero" />
      <HomeInfo />
      <ReadyForAdventureSection />
      <ExplorationSection />
      <Blog content={blogData} id="home-blog" />
      <EventFinder />
    </main>
  );
}
