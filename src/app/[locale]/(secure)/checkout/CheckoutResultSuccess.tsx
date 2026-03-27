"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Confetti from "@/components/feedback/Confetti";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import { parseMercadoPagoCheckoutReturnParams } from "@/lib/helpers/mercadopago-checkout-params";
import { persistMercadoPagoCheckoutReturnParams } from "@/lib/helpers/persist-mercadopago-checkout-return";
import { confirmMercadoPagoPaymentFromReturnParams } from "@/lib/helpers/confirm-mercadopago-payment-from-return";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { MercadoPagoCheckoutReturnParams } from "@/lib/types/MercadoPagoCheckoutReturnParams";

interface BookingConfirmation {
  message: string;
  success: boolean;
}

interface CheckoutResultSuccessProps {
  hero: Dictionary["confirmation"]["hero"];
  labels: Dictionary["confirmation"]["page"];
  locale: string;
  /** From server `searchParams` on `/checkout/success`; falls back to client URL. */
  mercadoPagoParams?: MercadoPagoCheckoutReturnParams | null;
}

export default function CheckoutResultSuccess({
  hero,
  labels,
  locale,
  mercadoPagoParams: mercadoPagoParamsFromServer,
}: CheckoutResultSuccessProps) {
  const searchParams = useSearchParams();
  const [bookingConfirmation, setBookingConfirmation] =
    useState<BookingConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mercadoPagoParams = useMemo(() => {
    if (mercadoPagoParamsFromServer) return mercadoPagoParamsFromServer;
    return parseMercadoPagoCheckoutReturnParams(searchParams);
  }, [mercadoPagoParamsFromServer, searchParams]);

  useEffect(() => {
    void persistMercadoPagoCheckoutReturnParams(mercadoPagoParams);
    void confirmMercadoPagoPaymentFromReturnParams(mercadoPagoParams);
  }, [mercadoPagoParams]);

  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, "/dashboard");

  useEffect(() => {
    const mpParams = mercadoPagoParams;

    const fetchConfirmation = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "";

        const hasMpIds =
          mpParams.paymentId ||
          mpParams.collectionId ||
          mpParams.externalReference;

        if (backendUrl && hasMpIds) {
          const response = await fetch(`${backendUrl}/api/confirmation`, {
            body: JSON.stringify({
              bookingId: mpParams.externalReference,
              merchantOrderId: mpParams.merchantOrderId,
              paymentId: mpParams.paymentId ?? mpParams.collectionId,
              status:
                mpParams.status ?? mpParams.collectionStatus ?? "approved",
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setBookingConfirmation(data);
          } else {
            setError(data.message ?? labels.errorTitle);
          }
        } else if (
          mpParams.status === "approved" ||
          mpParams.collectionStatus === "approved"
        ) {
          setBookingConfirmation({
            message: labels.messageApproved,
            success: true,
          });
        } else if (hasMpIds) {
          const st = mpParams.status ?? mpParams.collectionStatus ?? "pending";
          setBookingConfirmation({
            message: labels.messagePending.replace("{status}", st),
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

    void fetchConfirmation();
  }, [mercadoPagoParams, labels]);

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
          <section
            className={cn(
              "container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20",
            )}
          >
            <div
              className={cn(
                "w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14",
              )}
              data-testid="confirmation-root"
            >
              <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
                {labels.body}
              </p>
              {bookingConfirmation && (
                <p className="text-center font-barlow text-base font-semibold leading-relaxed text-gray-800 md:text-lg">
                  {bookingConfirmation.message}
                </p>
              )}

              <div className="flex justify-center pt-2">
                <Button asChild size="lg" variant="default">
                  <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
                </Button>
              </div>
              <div className="flex justify-center pt-2">
                <Button asChild size="default" variant="link">
                  <Link
                    className="text-gray-500 hover:text-gray-700"
                    href={`/${locale}`}
                  >
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
