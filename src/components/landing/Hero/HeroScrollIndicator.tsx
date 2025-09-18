'use client';

import { HERO_CONTENT } from '@/lib/data/constants/hero';

export function HeroScrollIndicator() {
  return (
    <div
      className="scroll-indicator pointer-events-none select-none z-10"
      aria-hidden="true"
    >
      {HERO_CONTENT.SCROLL_TEXT}
    </div>
  );
}
