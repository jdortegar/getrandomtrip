'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import { slugify } from '@/lib/slugify';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

// Number of cards visible per viewport
const CARDS_PER_VIEW = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
} as const;

const CARD_GAP = {
  mobile: 24, // gap-6
  tablet: 24, // gap-6
  desktop: 32, // gap-8
} as const;

export function TravelerTypesCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const getViewportConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { cardsPerView: CARDS_PER_VIEW.desktop, gap: CARD_GAP.desktop };
    }
    const width = window.innerWidth;
    if (width < 768) {
      return { cardsPerView: CARDS_PER_VIEW.mobile, gap: CARD_GAP.mobile };
    }
    if (width < 1024) {
      return { cardsPerView: CARDS_PER_VIEW.tablet, gap: CARD_GAP.tablet };
    }
    return { cardsPerView: CARDS_PER_VIEW.desktop, gap: CARD_GAP.desktop };
  }, []);

  const scrollStep = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0;

    const { cardsPerView: currentCardsPerView, gap } = getViewportConfig();
    const containerWidth = container.clientWidth;
    const cardWidth =
      (containerWidth - gap * (currentCardsPerView - 1)) / currentCardsPerView;
    return cardWidth + gap;
  }, [getViewportConfig]);

  const getCardWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container) return '100%';

    const { cardsPerView: currentCardsPerView, gap } = getViewportConfig();
    const containerWidth = container.clientWidth;
    const cardWidth =
      (containerWidth - gap * (currentCardsPerView - 1)) / currentCardsPerView;
    return `${cardWidth}px`;
  }, [getViewportConfig]);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, clientWidth, scrollWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);

    // Update active index based on scroll position
    const step = scrollStep();
    const newIndex = Math.round(scrollLeft / step);
    setActiveIndex(Math.min(newIndex, initialTravellerTypes.length - 1));
  }, [scrollStep]);

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

    const handleResize = () => {
      updateScrollState();
    };

    updateScrollState();
    handleResize(); // Set initial cards per view
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState, getViewportConfig]);

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

    const sizeClasses = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
    const baseClasses = cn(
      'flex items-center justify-center rounded-full text-lg text-white transition-all',
      disabled
        ? 'bg-gray-200 cursor-not-allowed'
        : 'bg-primary hover:bg-primary/90 shadow-lg',
      sizeClasses,
    );

    return (
      <button
        aria-label={label}
        className={cn(baseClasses, className)}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {symbol}
      </button>
    );
  };

  return (
    <div className="container mx-auto px-20">
      {/* <p className="font-jost mb-6 text-center text-lg italic text-gray-600 md:mb-10 md:text-xl">
          {description}
        </p> */}

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
                key={type.title}
                className="flex-shrink-0"
                style={{ width: getCardWidth() }}
                initial={{ opacity: 0, y: 24 }}
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
                  className="w-full h-full"
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

      {/* Pagination Dots */}
      <div className="mt-6 flex justify-center gap-2">
        {initialTravellerTypes.map((_, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={index}
              aria-label={`Go to card ${index + 1}`}
              className={cn(
                'h-2 rounded-full transition-all',
                isActive
                  ? 'bg-primary w-8'
                  : 'w-2 bg-gray-300 hover:bg-gray-400',
              )}
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;
                const cardWidth = scrollStep();
                container.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth',
                });
              }}
              type="button"
            />
          );
        })}
      </div>
    </div>
  );
}
