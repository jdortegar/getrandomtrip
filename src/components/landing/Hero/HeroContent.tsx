'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HERO_CONTENT } from '@/lib/data/constants/hero';
import { TYPOGRAPHY_PRESETS } from '@/lib/typography';

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4">
      <h2 className={`${TYPOGRAPHY_PRESETS.DISPLAY_LARGE} text-white mb-4`}>
        {HERO_CONTENT.TITLE}
      </h2>

      <p
        className={`${TYPOGRAPHY_PRESETS.BODY_LARGE} text-gray-300 max-w-2xl mx-auto mb-8`}
      >
        {HERO_CONTENT.SUBTITLE}
      </p>

      <p
        className={`${TYPOGRAPHY_PRESETS.BODY_LARGE} text-gray-300 max-w-2xl mx-auto mb-8`}
      >
        {HERO_CONTENT.TAGLINE}
      </p>

      <Button
        asChild
        variant="primary"
        size="lg"
        className="mt-8 uppercase tracking-wider animate-pulse-once"
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
