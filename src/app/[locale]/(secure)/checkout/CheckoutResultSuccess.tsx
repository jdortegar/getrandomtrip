"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { AddToCalendarButton } from "@/components/app/checkout/AddToCalendarButton";
import { Button } from "@/components/ui/Button";
import Confetti from "@/components/feedback/Confetti";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import Section from "@/components/layout/Section";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface TripSummaryData {
  trip: {
    id: string;
    endDate: string | null;
    level: string;
    nights: number;
    originCity: string;
    originCountry: string;
    pax: number;
    startDate: string | null;
    type: string;
  };
  payment: {
    amount: number;
    currency: string;
    receiptUrl: string | null;
  };
}

interface CheckoutResultSuccessProps {
  hero: Dictionary["confirmation"]["hero"];
  labels: Dictionary["confirmation"]["page"];
  locale: string;
  stripeReturn?: {
    paymentIntent: string | null;
    redirectStatus: string | null;
  } | null;
}

function isXsed(type: string) {
  return type === "xsed";
}

export default function CheckoutResultSuccess({
  hero,
  labels,
  locale,
  stripeReturn,
}: CheckoutResultSuccessProps) {
  const searchParams = useSearchParams();
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;

  const redirectStatus =
    stripeReturn?.redirectStatus ?? searchParams.get("redirect_status");
  const hasFailed = redirectStatus === "requires_payment_method";

  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState<TripSummaryData | null>(null);

  const paymentIntentId =
    stripeReturn?.paymentIntent ?? searchParams.get("payment_intent");

  useEffect(() => {
    if (!paymentIntentId || hasFailed) return;
    fetch("/api/stripe/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIntentId]);

  useEffect(() => {
    if (!paymentIntentId || hasFailed) return;
    fetch(`/api/stripe/trip-summary?paymentIntentId=${paymentIntentId}`)
      .then((r) => r.json())
      .then((data: TripSummaryData) => setTripData(data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIntentId]);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
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
        <main className="grow">
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

  const xsedTrip = tripData && isXsed(tripData.trip.type);
  const fallbackImage = xsedTrip
    ? "/images/xsed-hero.jpg"
    : "/images/hero-image-1.jpeg";
  const videoSrc = xsedTrip
    ? "/videos/hero-xsed.mp4"
    : "/videos/hero-video-1.mp4";

  return (
    <>
      <div className="flex min-h-screen flex-col bg-white">
        <HeaderHero
          description={hero.description}
          fallbackImage={fallbackImage}
          subtitle={hero.subtitle}
          title={hero.title}
          videoSrc={videoSrc}
        />

        <Section
          subtitle={xsedTrip ? labels.xsedBody : labels.body}
          title={xsedTrip ? labels.xsedTitle : hero.title}
        >
          <div className="flex flex-col items-center">
            {/* Trip card — shown once data arrives */}
            {tripData && (
              <div className=" flex w-full max-w-xl items-start gap-6">
                <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    alt={tripData.trip.type.toUpperCase()}
                    className="object-cover"
                    fill
                    src={fallbackImage}
                  />
                </div>

                <div className="text-left flex flex-col gap-1.5">
                  <p className="font-bold text-gray-900">
                    {labels.xsedTripTypeLabel}{" "}
                    <span
                      className={xsedTrip ? "text-amber-600" : "text-gray-900"}
                    >
                      | {tripData.trip.type.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {xsedTrip
                      ? labels.xsedExperienceLabel
                      : tripData.trip.level}
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {tripData.payment.currency.toUpperCase()} {tripData.payment.amount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {labels.xsedReferenceLabel}{" "}
                    <span className="font-bold text-gray-900">
                      {tripData.trip.id}
                    </span>
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                      {tripData.trip.originCity}, {tripData.trip.originCountry}
                    </span>
                    <AddToCalendarButton
                      endDate={tripData.trip.endDate}
                      eventDescription={labels.calendarEventDescription}
                      locale={safeLocale}
                      nights={tripData.trip.nights}
                      originCity={tripData.trip.originCity}
                      originCountry={tripData.trip.originCountry}
                      startDate={tripData.trip.startDate}
                      tripType={tripData.trip.type}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-12 flex flex-col items-center gap-2">
              <Button asChild className="min-w-[280px]" size="lg" variant="default">
                <Link href={`/${safeLocale}/dashboard`}>
                  {labels.ctaMyTrips}
                </Link>
              </Button>
              {tripData?.payment.receiptUrl && (
                <a
                  className="text-sm text-gray-400 underline transition-colors hover:text-gray-600"
                  href={tripData.payment.receiptUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {xsedTrip ? labels.xsedDownloadCta : labels.receiptLink}
                </a>
              )}
            </div>
          </div>
        </Section>
      </div>

      <Confetti delay={200} duration={350} speed={3} />
    </>
  );
}
