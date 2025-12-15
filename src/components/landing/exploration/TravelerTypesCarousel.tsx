'use client';

import React from 'react';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { Carousel } from '@/components/Carousel';
import { motion } from 'framer-motion';

export function TravelerTypesCarousel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Carousel
        itemClassName="basis-full md:basis-1/3 lg:basis-1/4"
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
    </motion.div>
  );
}
