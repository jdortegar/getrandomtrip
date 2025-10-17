'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

export function TravelerTypesCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // w-80 = 320px
    const gap = 24; // space-x-6 = 24px
    const totalCardWidth = cardWidth + gap;
    const containerWidth = container.clientWidth;
    const visibleCards = Math.floor(containerWidth / totalCardWidth);

    let newIndex = currentIndex;
    if (direction === 'right') {
      newIndex = Math.min(
        currentIndex + 1,
        initialTravellerTypes.length - visibleCards,
      );
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    setCurrentIndex(newIndex);
    setTranslateX(-newIndex * totalCardWidth);
  };

  // Calculate if arrows should be visible
  const container = scrollContainerRef.current;
  const cardWidth = 320;
  const gap = 24;
  const totalCardWidth = cardWidth + gap;
  const containerWidth = container?.clientWidth || 0;
  const visibleCards = Math.floor(containerWidth / totalCardWidth);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < initialTravellerTypes.length - 4;

  return (
    <div className="py-4">
      <p className="text-center text-gray-600  italic font-jost text-lg">
        {EXPLORATION_CONSTANTS.TAB_DESCRIPTIONS['By Traveller']}
      </p>

      <div className="relative w-full">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-full p-3 hover:border-gray-400 transition-colors shadow-lg"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-full p-3 hover:border-gray-400 transition-colors shadow-lg"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        )}

        {/* Carousel Container */}
        <div ref={scrollContainerRef} className="relative py-8">
          <div
            className="flex space-x-4 pb-4 transition-transform duration-500 ease-in-out overflow-x-visible"
            style={{ transform: `translateX(${translateX}px)` }}
          >
            {initialTravellerTypes.map((type, index) => (
              <motion.div
                key={type.title}
                className="flex-shrink-0"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <TravelerTypeCard
                  title={type.title}
                  description={type.description}
                  imageUrl={type.imageUrl}
                  href={`/packages/by-type/${slugify(type.travelType)}`}
                  disabled={!type.enabled}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
