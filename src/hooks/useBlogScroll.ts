'use client';

import { useRef } from 'react';
import { BLOG_CONSTANTS } from '@/lib/data/constants/blog';

export function useBlogScroll() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * BLOG_CONSTANTS.SCROLL.AMOUNT;
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return {
    scrollContainerRef,
    handleScroll,
  };
}
