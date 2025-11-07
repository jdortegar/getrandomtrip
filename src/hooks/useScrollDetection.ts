'use client';

import { useEffect, useState } from 'react';

interface UseScrollDetectionOptions {
  variant: 'auto' | 'solid' | 'overlay';
  threshold?: number;
}

export function useScrollDetection({
  variant,
  threshold = 1,
}: UseScrollDetectionOptions) {
  const [overlay, setOverlay] = useState(true);

  useEffect(() => {
    if (variant !== 'auto') {
      setOverlay(variant === 'overlay');
      return;
    }

    const handleScroll = () => {
      const isOverlay = window.scrollY < threshold;
      setOverlay(isOverlay);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant, threshold]);

  return overlay;
}
