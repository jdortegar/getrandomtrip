"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { AddToCalendarButton } from "@/components/app/checkout/AddToCalendarButton";
import { Button } from "@/components/ui/Button";
import Confetti from "@/components/feedback/Confetti";
import HeaderHero from "@/components/journey/HeaderHero";
import Section from "@/components/layout/Section";
import {
  TravelerRosterSection,
  type TravelerRosterSectionHandle,
} from "@/components/app/travelers/TravelerRosterSection";
import { usePurchaseTracking } from "@/lib/hooks/useCommerceTracking";
import { getRevealCountdown } from "@/lib/helpers/getRevealCountdown";
import { getCardForType } from "@/lib/utils/traveler-card";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useVerifiedCheckoutResult } from "@/lib/hooks/useVerifiedCheckoutResult";

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

  const paymentIntentId = stripeReturn?.paymentIntent ?? searchParams.get("payment_intent");
  const verification = useVerifiedCheckoutResult(paymentIntentId);
  const tripData = verification.data;
  usePurchaseTracking(paymentIntentId, tripData);
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

  if (!tripData) {
    const status = verification.status;
    const title = status === "checking" ? labels.verifyingTitle : status === "pending" ? labels.pendingTitle : labels.errorTitle;
    const description = status === "missing" ? labels.missingPayment : status === "failed" ? labels.paymentNotCompleted : status === "error" ? labels.verificationError : labels.pendingDescription;
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <HeaderHero
          description={description}
          fallbackImage="/images/hero-image-1.jpeg"
          subtitle={labels.resultTitle}
          title={title}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <main className="container mx-auto grow px-4 py-12 text-center">
          <p aria-live="polite" role={status === "error" || status === "failed" ? "alert" : "status"}>{description}</p>
          <div className="mt-6 flex justify-center gap-3">
            {paymentIntentId && (
              <Button aria-busy={verification.isChecking} disabled={verification.isChecking} onClick={verification.retry} type="button">
                {verification.isChecking && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                {verification.isChecking ? labels.verifyingTitle : labels.checkPaymentStatus}
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href={`/${safeLocale}/dashboard`}>{labels.ctaMyTrips}</Link>
            </Button>
          </div>
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
                      style={{
                        filter: "brightness(0) saturate(0) invert(60%)",
                      }}
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
                    <p className="font-barlow-condensed text-3xl font-bold text-ink">
                      {tripData.payment.currency.toUpperCase()}{" "}
                      {tripData.payment.amount}
                    </p>
                  </div>

                  <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600">
                    <span>
                      {labels.xsedReferenceLabel}{" "}
                      <span className="font-bold text-ink">
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
                      aria-busy={savingTravelers}
                      className="min-w-[280px]"
                      disabled={savingTravelers}
                      onClick={() => void handleSaveTravelers()}
                      size="lg"
                      variant="default"
                    >
                      {savingTravelers && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
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
