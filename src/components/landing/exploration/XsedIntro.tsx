'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import esCopy from '@/dictionaries/es.json';
import enCopy from '@/dictionaries/en.json';

function getCopy(locale: string) {
  return locale.startsWith('en')
    ? enCopy.home.exploration.xsedIntro
    : esCopy.home.exploration.xsedIntro;
}

export function XsedIntro() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';
  const copy = getCopy(locale);

  return (
    <div className="relative w-full overflow-hidden container mx-auto px-4 md:px-20" style={{ minHeight: 420 }}>
      {/* Background image */}
      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${copy.backgroundImage})` }}
        />

        <div className="absolute inset-0 bg-black/45" />

        {/* Content */}
        <div className="text-left relative z-10 flex h-full min-h-[420px] flex-col justify-center px-10 md:px-16 lg:px-24">
          <p className="tracking-[6px] mb-2 font-barlow text-xs font-bold uppercase text-white">
            {copy.eyebrow}
          </p>
          <h3 className="mb-4 max-w-xl font-barlow-condensed text-5xl font-bold leading-none text-white md:text-5xl">
            {copy.title}
          </h3>
          <p className="mb-8 max-w-lg text-sm leading-relaxed text-white/85">
            {copy.description}
          </p>

          <Button asChild size="lg" variant="tertiary" className="mr-auto">
            <Link href={copy.ctaHref}>{copy.ctaLabel}</Link>
          </Button>

        </div>
      </div>
    </div>
  );
}
