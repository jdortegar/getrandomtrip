'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Confetti from '@/components/feedback/Confetti';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import HeaderHero from '@/components/journey/HeaderHero';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface CheckoutResultSuccessProps {
  hero: Dictionary['confirmation']['hero'];
  labels: Dictionary['confirmation']['page'];
  locale: string;
  /** Stripe redirect params parsed server-side from searchParams. */
  stripeReturn?: { paymentIntent: string | null; redirectStatus: string | null } | null;
}

export default function CheckoutResultSuccess({
  hero,
  labels,
  locale,
  stripeReturn,
}: CheckoutResultSuccessProps) {
  const searchParams = useSearchParams();
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');

  // Prefer server-parsed params; fall back to client URL for non-3DS in-page navigations
  const redirectStatus =
    stripeReturn?.redirectStatus ?? searchParams.get('redirect_status');
  const hasFailed = redirectStatus === 'requires_payment_method';

  const [loading, setLoading] = useState(false);
  const showSuccess = !hasFailed;

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <HeaderHero
          description={hero.description}
          fallbackImage="/images/hero-image-1.jpeg"
          subtitle={hero.subtitle}
          title={labels.errorTitle}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <main className="flex-grow">
          <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
            <div className="flex w-full max-w-3xl flex-col items-center space-y-4 rounded-lg bg-white px-6 py-10 text-center shadow-lg sm:px-8 sm:py-14">
              <p className="max-w-[80%] font-barlow text-base leading-relaxed text-gray-700 md:text-lg">
                {labels.errorTitle}
              </p>
              <Button
                className="mt-4"
                onClick={() => window.history.back()}
                size="lg"
                variant="default"
              >
                {labels.retry}
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <HeaderHero
          description={hero.description}
          fallbackImage="/images/hero-image-1.jpeg"
          subtitle={hero.subtitle}
          title={hero.title}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <main className="flex-grow">
          <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
            <div className="w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
              <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
                {labels.body}
              </p>
              <p className="text-center font-barlow text-base font-semibold leading-relaxed text-gray-800 md:text-lg">
                {labels.messageApproved}
              </p>
              <div className="flex justify-center pt-2">
                <Button asChild size="lg" variant="default">
                  <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
                </Button>
              </div>
              <div className="flex justify-center pt-2">
                <Button asChild size="default" variant="link">
                  <Link className="text-gray-500 hover:text-gray-700" href={`/${locale}`}>
                    {labels.ctaHome}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
      {showSuccess && <Confetti delay={200} duration={350} speed={3} />}
    </>
  );
}
