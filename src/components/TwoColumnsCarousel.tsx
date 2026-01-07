'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Carousel } from '@/components/display/Carousel';

interface TwoColumnsCarouselProps {
  children: React.ReactNode;
  leftColumn: {
    eyebrow?: string;
    subtitle: string;
    title: string;
  };
  className?: string;
}

const CARD_WIDTH = { desktop: 384, mobile: 288 } as const;
const CARD_GAP = 32;

function PaginationDots({
  activeIndex,
  count,
  onDotClick,
}: {
  activeIndex: number;
  count: number;
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          aria-label={`Go to slide ${index + 1}`}
          className={`h-2 w-2 rounded-full transition-all ${
            index === activeIndex
              ? 'bg-primary'
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          onClick={() => onDotClick(index)}
          type="button"
        />
      ))}
    </div>
  );
}

export default function TwoColumnsCarousel({
  children,
  className = '',
  leftColumn,
}: TwoColumnsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;

  const updateActiveIndex = () => {
    const container = scrollRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? CARD_WIDTH.mobile : CARD_WIDTH.desktop;
    const scrollLeft = container.scrollLeft;
    const newIndex = Math.round(scrollLeft / (cardWidth + CARD_GAP));
    setActiveIndex(Math.min(newIndex, totalItems - 1));
  };

  const handleDotClick = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? CARD_WIDTH.mobile : CARD_WIDTH.desktop;
    const scrollPosition = index * (cardWidth + CARD_GAP);

    container.scrollTo({
      behavior: 'smooth',
      left: scrollPosition,
    });
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateActiveIndex();
    container.addEventListener('scroll', updateActiveIndex);
    window.addEventListener('resize', updateActiveIndex);

    return () => {
      container.removeEventListener('scroll', updateActiveIndex);
      window.removeEventListener('resize', updateActiveIndex);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems]);

  return (
    <div
      className={`relative z-10 flex flex-col gap-12 md:flex-row md:items-center md:gap-16 ${className}`}
    >
      <aside className="flex w-full max-w-xl flex-col items-center text-center md:w-1/3 md:items-start md:text-left md:self-center">
        {leftColumn.eyebrow && (
          <p className="text-base md:text-lg font-bold md:tracking-[9px] tracking-[6px] uppercase text-[#4F96B6]">
            {leftColumn.eyebrow}
          </p>
        )}
        <h2 className="font-barlow-condensed text-[50px] md:text-[70px] uppercase font-bold mt-4 leading-none text-gray-900">
          {leftColumn.title}
        </h2>
        <p className="text-lg text-gray-900 mx-auto mt-8 md:mx-0">
          {leftColumn.subtitle}
        </p>
      </aside>

      <div className="relative flex-1 md:-mr-[40vw] md:min-w-2/3 md:pr-16">
        <div ref={scrollRef}>
          <Carousel
            className="pb-8 md:pb-10"
            options={{
              align: 'start',
              slidesToScroll: 1,
            }}
          >
            {childrenArray.map((child, index) => (
              <div key={index} className="w-72 flex-shrink-0 md:w-96 pr-8">
                {child}
              </div>
            ))}
          </Carousel>
        </div>
      </div>

      <div className="mt-6 flex w-full justify-center">
        <PaginationDots
          activeIndex={activeIndex}
          count={totalItems}
          onDotClick={handleDotClick}
        />
      </div>
    </div>
  );
}
