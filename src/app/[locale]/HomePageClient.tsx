'use client';

import React from 'react';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/Hero';
import Blog from '@/components/Blog';
import { ExplorationSection } from '@/components/landing/exploration';
import Testimonials from '@/components/Testimonials/Testimonials';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';
import { HOME_TESTIMONIALS } from '@/lib/data/home-testimonials';
import { useDictionary, useLocale } from '@/hooks/useDictionary';
import { XsedHero } from '@/components/app/xsed/XsedHero';
import type { TripperListItem } from '@/types/tripper';

interface HomePageClientProps {
  trippers: TripperListItem[];
}

export function HomePageClient({ trippers }: HomePageClientProps) {
  const home = useDictionary((d) => d.home);
  const locale = useLocale();

  return (
    <main style={{ scrollBehavior: 'smooth' }}>
      <Hero content={home.hero} scrollIndicator />
      <HomeInfo content={home.homeInfo} />
      <ExplorationSection content={home.exploration} trippers={trippers} />
      <Blog eyebrow={home.blog.eyebrow} subtitle={home.blog.subtitle} title={home.blog.title} posts={BLOG_CONSTANTS.posts} viewAll={home.blog.viewAll} />
      <XsedHero content={home.xsedHero} locale={locale} />
      <Testimonials 
        eyebrow={home.testimonials.eyebrow} 
        subtitle={home.testimonials.subtitle} 
        title={home.testimonials.title} 
        viewFullReviewLabel={home.testimonials.viewFullReviewLabel} 
        testimonials={HOME_TESTIMONIALS.items} />
    </main>
  );
}
