'use client';

import React from 'react';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { Carousel } from '@/components/Carousel';

export function TravelerTypesCarousel() {
  return (
    <Carousel
      itemClassName="basis-1/2 md:basis-1/3 lg:basis-1/4"
      slidesToScroll={1}
      fullViewportWidth
    >
      {initialTravellerTypes.map((type) => (
        <TravelerTypeCard
          key={type.title}
          className="h-full w-full"
          description={type.description}
          disabled={!type.enabled}
          href={`/packages/by-type/${slugify(type.travelType)}`}
          imageUrl={type.imageUrl}
          title={type.title}
        />
      ))}
    </Carousel>
  );
}
