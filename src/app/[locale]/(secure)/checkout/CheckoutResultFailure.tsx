'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import HeaderHero from '@/components/journey/HeaderHero';
import { Button } from '@/components/ui/Button';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { persistMercadoPagoCheckoutReturnParams } from '@/lib/helpers/persist-mercadopago-checkout-return';
import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

interface CheckoutResultFailureProps {
  labels: Dictionary['paymentFailure'];
  locale: string;
  mercadoPagoParams?: MercadoPagoCheckoutReturnParams | null;
}

export default function CheckoutResultFailure({
  labels,
  locale,
  mercadoPagoParams,
}: CheckoutResultFailureProps) {
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;

  /** Client / traveler dashboard — `/dashboard` (never `/dashboard/tripper`). */
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');

  const retryTripId = mercadoPagoParams?.externalReference?.trim() || null;
  const tryAgainHref = retryTripId
    ? pathForLocale(
        safeLocale,
        `/checkout?tripId=${encodeURIComponent(retryTripId)}`,
      )
    : pathForLocale(safeLocale, '/journey');

  useEffect(() => {
    if (!mercadoPagoParams) return;
    void persistMercadoPagoCheckoutReturnParams(mercadoPagoParams);
  }, [mercadoPagoParams]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <HeaderHero
        description={labels.body}
        subtitle={labels.subtitle}
        title={labels.title}
      />
      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
          <div className="w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
            <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
              {labels.body}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link href={tryAgainHref}>{labels.ctaTryAgain}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
