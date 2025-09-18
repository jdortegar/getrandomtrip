'use client';

import { useEffect, useState } from 'react';

interface UseScrollDetectionOptions {
  variant: 'auto' | 'solid';
  threshold?: number;
}

export function useScrollDetection({
  variant,
  threshold = 1,
}: UseScrollDetectionOptions) {
  const [overlay, setOverlay] = useState(true);

  useEffect(() => {
    if (variant !== 'auto') return;

    const heroElement = document.getElementById('hero-sentinel');

    if (!heroElement) {
      // Fallback to scroll-based detection
      const handleScroll = () => {
        const isOverlay = window.scrollY < threshold;
        setOverlay(isOverlay);
      };

      // Set initial state
      handleScroll();

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }

    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver(
      ([entry]) => {
        setOverlay(entry.isIntersecting);
      },
      {
        rootMargin: '-1px 0px 0px 0px',
        threshold: [0, 1],
      },
    );

    observer.observe(heroElement);
    return () => observer.disconnect();
  }, [variant, threshold]);

  return overlay;
}
