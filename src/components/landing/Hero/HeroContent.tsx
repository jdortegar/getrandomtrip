'use client';

import Link from 'next/link';
import { HERO_CONTENT } from '@/lib/data/constants/hero';

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4">
      <h2 className="font-caveat text-7xl font-bold leading-tight text-white mb-4">
        {HERO_CONTENT.TITLE}
      </h2>

      <p className="font-jost text-xl font-normal leading-relaxed text-gray-300 max-w-4xl mx-auto mb-8">
        {HERO_CONTENT.SUBTITLE}
      </p>

      <p className="font-jost text-lg font-normal leading-relaxed text-gray-300 max-w-2xl mx-auto mb-8">
        {HERO_CONTENT.TAGLINE}
      </p>

      <Link
        href={HERO_CONTENT.CTA_HREF}
        aria-label={HERO_CONTENT.CTA_ARIA_LABEL}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8 mt-8 uppercase tracking-wider animate-pulse-once border-white text-white hover:bg-white hover:text-gray-900 font-bold"
      >
        {HERO_CONTENT.CTA_TEXT}
      </Link>
    </div>
  );
}
