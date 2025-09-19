'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
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

      <Button
        asChild
        variant="outline"
        size="lg"
        className="mt-8 uppercase tracking-wider animate-pulse-once border-white text-white hover:bg-white hover:text-gray-900 font-bold"
      >
        <Link
          href={HERO_CONTENT.CTA_HREF}
          aria-label={HERO_CONTENT.CTA_ARIA_LABEL}
        >
          {HERO_CONTENT.CTA_TEXT}
        </Link>
      </Button>
    </div>
  );
}
