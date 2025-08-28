'use client';

import { SurpriseTripHero } from '@/components/SurpriseTripHero';
import { cities, tripTypes } from '@/lib/data';

interface TripStartPayload {
  mode: 'reservar' | 'regalar';
  tripType: 'vuelo_hotel' | 'solo_hotel' | 'experiencia';
  fromCity: string;
  travelers: 1 | 2 | 3 | 4 | 5 | 6;
}

export function SurpriseTripHeroWrapper() {
  const handleTripStart = (payload: TripStartPayload) => {
    console.log('Trip started:', payload);
    // Here you would typically navigate to the next step or make an API call
  };

  return (
    <SurpriseTripHero
      backgroundUrl="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
      cities={cities}
      tripTypes={tripTypes}
      defaultCity="lisboa"
      defaultTravelers={2}
      onStart={handleTripStart}
    />
  );
}
