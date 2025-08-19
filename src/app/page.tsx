'use client';

import { Navigation } from '@/components/Navigation';
import { SurpriseTripHero } from '@/components/SurpriseTripHero';
import { Testimonials } from '@/components/Testimonials';
import { TripGrid } from '@/components/TripGrid';
import { CardScroll } from '@/components/CardScroll';
import { StepsHero } from '@/components/StepsHero';
import { NewsletterHero } from '@/components/NewsletterHero';
import { TrustSignal } from '@/components/TrustSignal';
import { Counters } from '@/components/Counters';
import { Footer } from '@/components/Footer';

import {
  cities,
  tripTypes,
  testimonials,
  tripCards,
  cityCards,
  trustSignals,
  newsletterHero,
  trustSignalItems,
  counterItems,
  footerData,
} from '@/lib/data';

interface TripStartPayload {
  mode: 'reservar' | 'regalar';
  tripType: 'vuelo_hotel' | 'solo_hotel' | 'experiencia';
  fromCity: string;
  travelers: 1 | 2 | 3 | 4 | 5 | 6;
}

const handleTripStart = async (payload: TripStartPayload) => {
  console.log('Trip started:', payload);
  // Here you would typically navigate to the next step or make an API call
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navigation />

      <SurpriseTripHero
        backgroundUrl="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        cities={cities}
        tripTypes={tripTypes}
        defaultCity="lisboa"
        defaultTravelers={2}
        onStart={handleTripStart}
      />

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
