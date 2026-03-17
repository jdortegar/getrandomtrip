'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Confetti from '@/components/feedback/Confetti';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import HeaderHero from '@/components/journey/HeaderHero';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export interface MercadoPagoSuccessParams {
  collection_id?: string;
  collection_status?: string;
  external_reference?: string;
  merchant_order_id?: string;
  payment_id?: string;
  preference_id?: string;
  status?: string;
}

interface BookingConfirmation {
  message: string;
  success: boolean;
}

interface CheckoutResultSuccessProps {
  locale: string;
  hero: Dictionary['confirmation']['hero'];
  labels: Dictionary['confirmation']['page'];
}

function getSuccessParamsFromSearchParams(
  searchParams: URLSearchParams,
): MercadoPagoSuccessParams | null {
  const paymentId = searchParams.get('payment_id');
  const collectionId = searchParams.get('collection_id');
  const externalRef = searchParams.get('external_reference');
  if (!paymentId && !collectionId && !externalRef) return null;
  return {
    collection_id: collectionId ?? undefined,
    collection_status: searchParams.get('collection_status') ?? undefined,
    external_reference: externalRef ?? undefined,
    merchant_order_id: searchParams.get('merchant_order_id') ?? undefined,
    payment_id: paymentId ?? collectionId ?? undefined,
    preference_id: searchParams.get('preference_id') ?? undefined,
    status: searchParams.get('status') ?? searchParams.get('collection_status') ?? undefined,
  };
}

export default function CheckoutResultSuccess({
  locale,
  hero,
  labels,
}: CheckoutResultSuccessProps) {
  const searchParams = useSearchParams();
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mpParams = getSuccessParamsFromSearchParams(searchParams);

    const fetchConfirmation = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

        if (backendUrl && mpParams) {
          const response = await fetch(`${backendUrl}/api/confirmation`, {
            body: JSON.stringify({
              bookingId: mpParams.external_reference,
              merchantOrderId: mpParams.merchant_order_id,
              paymentId: mpParams.payment_id ?? mpParams.collection_id,
              status: mpParams.status ?? 'approved',
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setBookingConfirmation(data);
          } else {
            setError(data.message ?? labels.errorTitle);
          }
        } else if (mpParams?.status === 'approved' || mpParams?.collection_status === 'approved') {
          setBookingConfirmation({
            message: labels.messageApproved,
            success: true,
          });
        } else if (mpParams) {
          const status = mpParams.status ?? mpParams.collection_status ?? 'pending';
          setBookingConfirmation({
            message: labels.messagePending.replace('{status}', status),
            success: true,
          });
        } else {
          setBookingConfirmation({
            message: labels.messageGeneric,
            success: true,
          });
        }
      } catch {
        setError(labels.errorTitle);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmation();
  }, [searchParams, labels]);

  const showSuccess = Boolean(bookingConfirmation && !error);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <HeaderHero
          description={hero.description}
          subtitle={hero.subtitle}
          title={labels.errorTitle}
        />
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
          <div className="max-w-3xl w-full space-y-4 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14 flex flex-col items-center text-center">
            <p className="max-w-[80%] font-barlow text-base leading-relaxed text-gray-700 md:text-lg">
              {error}
            </p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
              size="lg"
              variant="default"
            >
              {labels.retry}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <HeaderHero
          description={hero.description}
          subtitle={hero.subtitle}
          title={hero.title}
        />
        <section
          className={cn(
            'container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20',
            showSuccess && 'bg-orange-50/80',
          )}
        >
          <div
            className={cn(
              'max-w-3xl w-full space-y-4 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14 flex flex-col items-center text-center',
              showSuccess && '-mt-12 sm:-mt-14',
            )}
            data-testid="confirmation-root"
          >
            <p className="max-w-[80%] text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
              {labels.body}
            </p>
            {bookingConfirmation && (
              <p className="max-w-[80%] text-center font-barlow text-base font-semibold leading-relaxed text-gray-800 md:text-lg">
                {bookingConfirmation.message}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:mt-8">
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href={`/${locale}/reveal-destination`}>
                  {labels.ctaReveal}
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto" size="lg" variant="secondary">
                <Link href={`/${locale}/journey`}>
                  {labels.ctaBackToJourney}
                </Link>
              </Button>
            </div>
            <Button asChild className="mt-2" variant="link" size="default">
              <Link href={`/${locale}`} className="text-gray-500 hover:text-gray-700">
                {labels.ctaHome}
              </Link>
            </Button>
          </div>
        </section>
      </div>
      {showSuccess && <Confetti delay={200} duration={350} speed={3} />}
    </>
  );
}
