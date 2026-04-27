'use client';

import Link from 'next/link';
import HeaderHero from '@/components/journey/HeaderHero';
import { Button } from '@/components/ui/Button';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface CheckoutResultPendingProps {
  labels: Dictionary['paymentPending'];
  locale: string;
}

export default function CheckoutResultPending({
  labels,
  locale,
}: CheckoutResultPendingProps) {
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <HeaderHero
        description={labels.body}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={labels.subtitle}
        title={labels.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
          <div className="w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
            <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
              {labels.body}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" variant="default">
                <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${locale}`}>{labels.ctaHome}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
