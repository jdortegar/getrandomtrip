import { Suspense } from 'react';
import { SurpriseTripHeroWrapper } from '@/components/SurpriseTripHeroWrapper';
import { Testimonials } from '@/components/Testimonials';
import { TripGrid } from '@/components/TripGrid';
import { CardScroll } from '@/components/CardScroll';
import { StepsHero } from '@/components/StepsHero';
import { NewsletterHero } from '@/components/NewsletterHero';
import { TrustSignal } from '@/components/TrustSignal';
import { Counters } from '@/components/Counters';
import { Footer } from '@/components/Footer';
import { ErrorHandler } from '@/components/ErrorHandler';

import {
  testimonials,
  tripCards,
  cityCards,
  trustSignals,
  newsletterHero,
  trustSignalItems,
  counterItems,
  footerData,
} from '@/lib/data';

export default function Home() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>

      <SurpriseTripHeroWrapper />

      <Testimonials testimonials={testimonials} />

      <TripGrid tripCards={tripCards} />

      <CardScroll cityCards={cityCards} />

      <StepsHero trustSignals={trustSignals} />

      <NewsletterHero data={newsletterHero} />

      <TrustSignal trustSignalItems={trustSignalItems} />

      <Counters counterItems={counterItems} />

      <Footer data={footerData} />
    </div>
  );
}
