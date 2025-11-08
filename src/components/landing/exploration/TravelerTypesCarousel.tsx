'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

const CARD_WIDTH = {
  mobile: 288, // w-72
  desktop: 384, // w-96
} as const;

const CARD_GAP = {
  mobile: 24, // gap-6
  desktop: 32, // gap-8
} as const;

export function TravelerTypesCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollStep = useCallback(() => {
    if (typeof window === 'undefined') {
      return CARD_WIDTH.desktop + CARD_GAP.desktop;
    }
    const isMobile = window.innerWidth < 768;
    const gap = isMobile ? CARD_GAP.mobile : CARD_GAP.desktop;
    const width = isMobile ? CARD_WIDTH.mobile : CARD_WIDTH.desktop;
    return width + gap;
  }, []);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, clientWidth, scrollWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const handleScroll = useCallback(
    (direction: 'left' | 'right') => {
      const container = containerRef.current;
      if (!container) return;

      const distance = scrollStep();
      const delta = direction === 'left' ? -distance : distance;
      container.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [scrollStep],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollState();
    const handleResize = () => updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState]);

  const description = useMemo(
    () => EXPLORATION_CONSTANTS.TAB_DESCRIPTIONS['By Traveller'],
    [],
  );

  const ArrowButton = ({
    direction,
    onClick,
    disabled,
    className,
    size = 'md',
  }: {
    direction: 'left' | 'right';
    onClick: () => void;
    disabled: boolean;
    className?: string;
    size?: 'md' | 'lg';
  }) => {
    const label =
      direction === 'left' ? 'Ver tipos anteriores' : 'Ver más tipos';
    const symbol = direction === 'left' ? '‹' : '›';

    const sizeClasses =
      size === 'lg' ? 'h-11 w-11 shadow-lg' : 'h-10 w-10 shadow-sm';
    const baseClasses =
      'flex items-center justify-center rounded-full border border-gray-300 bg-white text-lg text-gray-600 transition-all hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40';

    return (
      <button
        aria-label={label}
        className={`${baseClasses} ${sizeClasses} ${className ?? ''}`.trim()}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {symbol}
      </button>
    );
  };

  return (
    <section className="py-6 md:py-8">
      <div className="rt-container">
        <p className="font-jost mb-6 text-center text-lg italic text-gray-600 md:mb-10 md:text-xl">
          {description}
        </p>

        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
          <ArrowButton
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 transform sm:left-4 lg:left-6"
            direction="left"
            disabled={!canScrollLeft}
            onClick={() => handleScroll('left')}
            size="lg"
          />

          <ArrowButton
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 transform sm:right-4 lg:right-6"
            direction="right"
            disabled={!canScrollRight}
            onClick={() => handleScroll('right')}
            size="lg"
          />

          <div
            className="overflow-hidden px-4 sm:px-6 lg:px-8"
            ref={containerRef}
          >
            <div className="flex gap-6 md:gap-8">
              {initialTravellerTypes.map((type) => (
                <motion.div
                  className="flex-shrink-0"
                  initial={{ opacity: 0, y: 24 }}
                  key={type.title}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
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

        <div className="mt-4 flex justify-center gap-3 md:hidden">
          <ArrowButton
            direction="left"
            disabled={!canScrollLeft}
            onClick={() => handleScroll('left')}
          />
          <ArrowButton
            direction="right"
            disabled={!canScrollRight}
            onClick={() => handleScroll('right')}
          />
        </div>
      </div>
    </section>
  );
}
