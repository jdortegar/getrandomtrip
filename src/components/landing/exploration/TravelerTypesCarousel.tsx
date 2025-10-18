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

    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 288 : 384; // w-72 (mobile) or w-96 (desktop)
    const gap = 32; // space-x-8 = 32px
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = isMobile ? 288 : 384;
  const gap = 32;
  const totalCardWidth = cardWidth + gap;
  const containerWidth = container?.clientWidth || 0;
  const visibleCards = Math.floor(containerWidth / totalCardWidth);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight =
    currentIndex < initialTravellerTypes.length - (isMobile ? 1 : 2);

  return (
    <div className="py-6 md:py-8">
      <p className="font-jost mb-6 text-center text-lg italic text-gray-600 md:mb-10 md:text-xl">
        {EXPLORATION_CONSTANTS.TAB_DESCRIPTIONS['By Traveller']}
      </p>

      <div className="relative w-full">
        {/* Left Arrow - Enhanced */}
        {canScrollLeft && (
          <button
            aria-label="Scroll left"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 transform rounded-full border border-gray-300 bg-white p-2 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-xl md:left-4 md:p-3"
            onClick={() => handleScroll('left')}
          >
            <svg
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow - Enhanced */}
        {canScrollRight && (
          <button
            aria-label="Scroll right"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 transform rounded-full border border-gray-300 bg-white p-2 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-xl md:right-4 md:p-3"
            onClick={() => handleScroll('right')}
          >
            <svg
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 5l7 7m0 0l-7 7m7-7H3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Carousel Container */}
        <div className="relative py-8 md:py-12" ref={scrollContainerRef}>
          <div
            className="flex space-x-8 pb-4 overflow-x-visible transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${translateX}px)` }}
          >
            {initialTravellerTypes.map((type, index) => (
              <motion.div
                className="flex-shrink-0"
                initial={{ opacity: 0, y: 30 }}
                key={type.title}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <TravelerTypeCard
                  description={type.description}
                  disabled={!type.enabled}
                  href={`/packages/by-type/${slugify(type.travelType)}`}
                  imageUrl={type.imageUrl}
                  title={type.title}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
