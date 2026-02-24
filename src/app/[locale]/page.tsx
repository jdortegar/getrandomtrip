import React from 'react';
import HomeInfo from '@/components/HomeInfo';
import Hero from '@/components/Hero';
import { ExplorationSection } from '@/components/landing/exploration';
import Testimonials from '@/components/Testimonials';
import Blog from '@/components/Blog';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';
import {
  BENEFITS_IMAGE_SRCS,
  HOW_IT_WORKS_IMAGE_SRCS,
} from '@/lib/data/how-it-works';
import { HERO_STATIC } from '@/lib/data/home-hero';
import { HOME_TESTIMONIALS } from '@/lib/data/home-testimonials';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import { getAllTrippers } from '@/lib/db/tripper-queries';

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = await getDictionary(locale);
  const trippers = await getAllTrippers();
  const home = dict.home;
  const howItWorksSteps = home.howItWorksSteps.map((step, i) => ({
    ...step,
    imageSrc: HOW_IT_WORKS_IMAGE_SRCS[i] ?? '',
  }));
  const benefitsSteps = home.benefitsSteps.map((step, i) => ({
    ...step,
    imageSrc: BENEFITS_IMAGE_SRCS[i] ?? '',
  }));

  const dictTypesByKey = Object.fromEntries(
    home.explorationTravelerTypes.map((t) => [t.key, t]),
  );
  const travelerTypes = initialTravellerTypes.map((type) => {
    const localized = dictTypesByKey[type.travelType.toLowerCase()];
    return {
      ...type,
      description: localized?.description ?? type.description,
      title: localized?.title ?? type.title,
    };
  });

  const heroContent = {
    branding: {
      repeatText: home.heroBrandingRepeatText,
      text: home.heroBrandingText,
    },
    fallbackImage: HERO_STATIC.fallbackImage,
    primaryCta: {
      ariaLabel: home.heroPrimaryCtaAriaLabel,
      href: HERO_STATIC.primaryCtaHref,
      text: home.heroPrimaryCtaText,
    },
    scrollText: home.heroScrollText,
    subtitle: home.heroSubtitle,
    title: home.heroTitle,
    videoSrc: HERO_STATIC.videoSrc,
  };

  return (
    <main style={{ scrollBehavior: 'smooth' }}>
      <Hero content={heroContent} scrollIndicator />
      <HomeInfo
        benefitsSteps={benefitsSteps}
        ctaText={home.homeInfoCtaText}
        eyebrow={home.homeInfoEyebrow}
        howItWorksSteps={howItWorksSteps}
        sectionAriaLabel={home.homeInfoSectionAriaLabel}
        tabBenefitsLabel={home.homeInfoTabBenefits}
        tabHowLabel={home.homeInfoTabHow}
        title={home.homeInfoTitle}
      />
      <ExplorationSection
        comingSoonText={home.explorationComingSoon}
        eyebrow={home.explorationEyebrow}
        subtitle={home.explorationSubtitle}
        tabs={home.explorationTabs.map((tab) => ({
          ...tab,
          href: tab.href ? pathForLocale(locale, tab.href) : undefined,
        }))}
        title={home.explorationTitle}
        travelerTypes={travelerTypes}
        trippers={trippers as any}
        trippersButtonText={home.explorationButtonTrippers}
        trippersHref={pathForLocale(locale, '/trippers')}
      />
      <Blog
        carouselSlideAriaLabel={home.blogCarouselSlideAriaLabel}
        eyebrow={home.blogEyebrow}
        id="home-blog"
        posts={BLOG_CONSTANTS.posts}
        subtitle={home.blogSubtitle}
        title={home.blogTitle}
        viewAll={{
          href: pathForLocale(locale, '/blog'),
          subtitle: home.blogViewAllSubtitle,
          title: home.blogViewAllTitle,
        }}
      />
      <Testimonials
        eyebrow={home.testimonialsEyebrow}
        subtitle={home.testimonialsSubtitle}
        testimonials={HOME_TESTIMONIALS.items}
        title={home.testimonialsTitle}
        viewFullReviewLabel={home.testimonialsViewFullReview}
      />
    </main>
  );
}
