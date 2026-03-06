import React from 'react';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/Hero';
import Blog from '@/components/Blog';
import { ExplorationSection } from '@/components/landing/exploration';
import Testimonials from '@/components/Testimonials';
import { HomeWrapper } from '@/components/waitlist/HomeWrapper';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';
import {
  BENEFITS_IMAGE_SRCS,
  HOW_IT_WORKS_IMAGE_SRCS,
} from '@/lib/data/how-it-works';
import { HOME_TESTIMONIALS } from '@/lib/data/home-testimonials';
import { getAllTrippers } from '@/lib/db/tripper-queries';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = await getDictionary(locale);
  const trippers = await getAllTrippers();
  const home = dict.home;
  const homeInfoContent = {
    ...home.homeInfo,
    benefitsSteps: home.homeInfo.benefitsSteps.map((step, i) => ({
      ...step,
      imageSrc: BENEFITS_IMAGE_SRCS[i] ?? '',
    })),
    howItWorksSteps: home.homeInfo.howItWorksSteps.map((step, i) => ({
      ...step,
      imageSrc: HOW_IT_WORKS_IMAGE_SRCS[i] ?? '',
    })),
  };

  return (
    <HomeWrapper dict={dict}>
      <main style={{ scrollBehavior: 'smooth' }}>
        <Hero content={home.hero} scrollIndicator />
        <HomeInfo content={homeInfoContent} />
        <ExplorationSection
          content={home.exploration}
          trippers={trippers as any}
        />
        <Blog
          content={home.blog}
          posts={BLOG_CONSTANTS.posts}
        />
        <Testimonials
          content={home.testimonials}
          testimonials={HOME_TESTIMONIALS.items}
        />
      </main>
    </HomeWrapper>
  );
}
