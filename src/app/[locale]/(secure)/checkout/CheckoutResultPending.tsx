'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import HeaderHero from '@/components/journey/HeaderHero';
import { Button } from '@/components/ui/Button';
import { parseMercadoPagoCheckoutReturnParams } from '@/lib/helpers/mercadopago-checkout-params';
import { persistMercadoPagoCheckoutReturnParams } from '@/lib/helpers/persist-mercadopago-checkout-return';
import { confirmMercadoPagoPaymentFromReturnParams } from '@/lib/helpers/confirm-mercadopago-payment-from-return';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

interface CheckoutResultPendingProps {
  labels: Dictionary['paymentPending'];
  locale: string;
  /** From server `searchParams` on `/checkout/pending`; falls back to client URL. */
  mercadoPagoParams?: MercadoPagoCheckoutReturnParams | null;
}

export default function CheckoutResultPending({
  labels,
  locale,
  mercadoPagoParams: mercadoPagoParamsFromServer,
}: CheckoutResultPendingProps) {
  const searchParams = useSearchParams();

  const mercadoPagoParams = useMemo(() => {
    if (mercadoPagoParamsFromServer) return mercadoPagoParamsFromServer;
    return parseMercadoPagoCheckoutReturnParams(searchParams);
  }, [mercadoPagoParamsFromServer, searchParams]);

  useEffect(() => {
    void persistMercadoPagoCheckoutReturnParams(mercadoPagoParams);
    void confirmMercadoPagoPaymentFromReturnParams(mercadoPagoParams);
  }, [mercadoPagoParams]);

  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');

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
