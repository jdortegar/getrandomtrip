"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { AddToCalendarButton } from "@/components/app/checkout/AddToCalendarButton";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import Confetti from "@/components/feedback/Confetti";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import Section from "@/components/layout/Section";
import {
  TravelerRosterSection,
  type TravelerRosterSectionHandle,
} from "@/components/app/travelers/TravelerRosterSection";
import { trackPurchase } from "@/lib/helpers/tracking/gtm";
import { getRevealCountdown } from "@/lib/helpers/getRevealCountdown";
import { getCardForType } from "@/lib/utils/traveler-card";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TravelerRoster } from "@/types/traveler";

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
    roster: TravelerRoster;
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
  travelersCopy: Dictionary["inviteTravelers"];
}

function isXsed(type: string) {
  return type === "xsed";
}

export default function CheckoutResultSuccess({
  hero,
  labels,
  locale,
  stripeReturn,
  travelersCopy,
}: CheckoutResultSuccessProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;

  const redirectStatus =
    stripeReturn?.redirectStatus ?? searchParams.get("redirect_status");
  const hasFailed = redirectStatus === "requires_payment_method";

  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState<TripSummaryData | null>(null);
  const rosterRef = useRef<TravelerRosterSectionHandle>(null);
  const [savingTravelers, setSavingTravelers] = useState(false);

  async function handleSaveTravelers() {
    setSavingTravelers(true);
    try {
      const allComplete = await rosterRef.current?.saveAll();
      if (allComplete) {
        router.push(`/${safeLocale}/dashboard`);
        return;
      }
    } finally {
      setSavingTravelers(false);
    }
  }

  const paymentIntentId =
    stripeReturn?.paymentIntent ?? searchParams.get("payment_intent");

  useEffect(() => {
    if (!paymentIntentId || hasFailed) return;
    // confirm-payment must resolve first — it's what flips Payment.status to
    // APPROVED when the Stripe webhook hasn't landed yet, and trip-summary's
    // roster lookup only materializes traveler rows for an APPROVED payment.
    // Firing both in parallel raced the two and could leave the roster
    // permanently empty if trip-summary won.
    fetch("/api/stripe/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    })
      .catch(() => {})
      .then(() =>
        fetch(`/api/stripe/trip-summary?paymentIntentId=${paymentIntentId}`),
      )
      .then((r) => r?.json())
      .then((data: TripSummaryData | undefined) => {
        if (!data) return;
        setTripData(data);
        trackPurchase({
          transaction_id: paymentIntentId,
          value: data.payment.amount,
          currency: data.payment.currency.toUpperCase(),
        });
      })
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
  const revealCountdown =
    tripData?.trip.startDate != null
      ? getRevealCountdown(new Date(tripData.trip.startDate), new Date())
      : null;
  const typeCard = tripData
    ? getCardForType(tripData.trip.type, safeLocale)
    : null;

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
          subtitle={xsedTrip ? labels.xsedBody : undefined}
          title={xsedTrip ? labels.xsedTitle : undefined}
        >
          <div className="flex flex-col items-center">
            {/* Trip card — skeleton while data is loading, real card once it arrives */}
            {!tripData && (
              <div className="flex w-full max-w-3xl items-start gap-5 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
                <Skeleton className="h-40 w-40 shrink-0 rounded-2xl sm:h-64 sm:w-48" />
                <div className="flex flex-1 flex-col gap-2.5 pt-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="mt-1 h-8 w-28" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            )}

            {tripData && (
              <div className="flex w-full max-w-3xl items-start gap-5 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
                {typeCard?.img ? (
                  <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl sm:h-64 sm:w-48">
                    <Image
                      alt={typeCard.title}
                      className="object-cover"
                      fill
                      src={typeCard.img}
                    />
                  </div>
                ) : (
                  <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 sm:h-64 sm:w-48">
                    <Image
                      alt=""
                      height={72}
                      src="/assets/logos/iso-randomtrip.svg"
                      style={{ filter: "brightness(0) saturate(0) invert(60%)" }}
                      unoptimized
                      width={72}
                    />
                  </div>
                )}

                <div className="flex flex-col justify-center gap-1.5 text-left">
                  <div>
                    <p className="font-barlow text-2xl font-bold">
                      <span>{labels.xsedTripTypeLabel}</span>
                      <span className="px-1.5">|</span>
                      <span
                        className={xsedTrip ? "text-amber-600" : "text-sky-600"}
                      >
                        {tripData.trip.type.toUpperCase()}
                      </span>
                    </p>
                    <p className="font-barlow text-lg font-normal text-gray-500">
                      {labels.experienceCaptionLabel}{" "}
                      <span className="font-bold">
                        {xsedTrip
                          ? labels.xsedExperienceLabel
                          : tripData.trip.level}
                      </span>
                    </p>
                  </div>

                  <div className="mt-1">
                    <p className="text-base text-gray-500">
                      {labels.totalPaidLabel}
                    </p>
                    <p className="font-barlow-condensed text-3xl font-bold text-gray-900">
                      {tripData.payment.currency.toUpperCase()}{" "}
                      {tripData.payment.amount}
                    </p>
                  </div>

                  <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600">
                    <span>
                      {labels.xsedReferenceLabel}{" "}
                      <span className="font-bold text-gray-900">
                        {tripData.trip.id}
                      </span>
                      {tripData.payment.receiptUrl && (
                        <>
                          {" · "}
                          <a
                            className="text-secondary underline transition-colors hover:text-secondary/80"
                            href={tripData.payment.receiptUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {labels.receiptLink}
                          </a>
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                      {labels.departingFromLabel} {tripData.trip.originCity},{" "}
                      {tripData.trip.originCountry}
                    </span>
                    {revealCountdown && (
                      <span>
                        {revealCountdown.revealed
                          ? labels.revealedLabel
                          : labels.revealCountdownLabel
                              .replace("{days}", String(revealCountdown.days))
                              .replace(
                                "{hours}",
                                String(revealCountdown.hours),
                              )}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
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

            {/* Invite your travel friends */}
            {tripData?.trip.roster && (
              <div className="mt-12 flex w-full justify-center">
                <TravelerRosterSection
                  copy={travelersCopy}
                  locale={safeLocale}
                  ref={rosterRef}
                  roster={tripData.trip.roster}
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-12 flex flex-col items-center gap-2">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/${safeLocale}/dashboard`}>
                    {labels.ctaMyTrips}
                  </Link>
                </Button>
                {tripData?.trip.roster &&
                  tripData.trip.roster.cap > 0 &&
                  !tripData.trip.roster.locked && (
                    <Button
                      className="min-w-[280px]"
                      disabled={savingTravelers}
                      onClick={() => void handleSaveTravelers()}
                      size="lg"
                      variant="default"
                    >
                      {savingTravelers
                        ? labels.savingTravelersAction
                        : labels.saveTravelersAction}
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </Section>
      </div>

      <Confetti delay={200} duration={350} speed={3} />
    </>
  );
}
