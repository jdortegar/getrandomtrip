import React from 'react';
import EventFinder from '@/components/EventFinder';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/Hero';
import { ExplorationSection } from '@/components/landing/exploration';
import ReadyForAdventureSection from '@/components/ReadyForAdventureSection';
import Testimonials from '@/components/Testimonials';
import Blog from '@/components/Blog';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';
import { HERO_CONTENT } from '@/lib/data/home-hero';
import { HOME_TESTIMONIALS } from '@/lib/data/home-testimonials';
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
      <Blog
        id="home-blog"
        eyebrow="Historias de viajeros"
        posts={BLOG_CONSTANTS.posts}
        subtitle={BLOG_CONSTANTS.subtitle}
        title={BLOG_CONSTANTS.title}
        viewAll={BLOG_CONSTANTS.viewAll}
      />
      {/* <EventFinder /> */}
      {/* <ReadyForAdventureSection /> */}
      <Testimonials
        eyebrow="Opiniones de viajeros"
        testimonials={HOME_TESTIMONIALS.items}
        title={HOME_TESTIMONIALS.title}
      />
    </main>
  );
}
