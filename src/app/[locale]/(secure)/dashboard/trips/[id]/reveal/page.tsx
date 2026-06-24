"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { Button } from "@/components/ui/Button";
import Img from "@/components/common/Img";
import { ArrowLeft, Calendar, MapPin, Sparkles } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { getRevealCountdown } from "@/lib/helpers/getRevealCountdown";
import type { TripRevealDict } from "@/lib/types/dictionary";
import LoadingSpinner from "@/components/layout/LoadingSpinner";

interface TripRevealData {
  id: string;
  status: string;
  startDate: string;
  city: string;
  country: string;
  actualDestination?: string | null;
  experience?: {
    id: string;
    heroImage?: string | null;
    destinationCity?: string | null;
    destinationCountry?: string | null;
  } | null;
}

interface CountdownState {
  revealed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function RevealContent() {
  const params = useParams();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripRevealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copy, setCopy] = useState<TripRevealDict | null>(null);
  const [countdown, setCountdown] = useState<CountdownState | null>(null);

  const tripId = params.id as string;
  const rawLocale = (params.locale as string) ?? "es";
  const locale = hasLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  useEffect(() => {
    getDictionary(locale).then((d) => setCopy(d.tripReveal));
  }, [locale]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/trips/${tripId}`)
      .then((r) => {
        if (r.status === 403 || r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setNotFound(true);
          return;
        }
        setTrip(data.trip as TripRevealData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tripId, session?.user?.id]);

  useEffect(() => {
    if (!trip || trip.status !== "CONFIRMED") return;

    function tick() {
      const startDate = new Date(trip!.startDate);
      setCountdown(getRevealCountdown(startDate, new Date()));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [trip]);

  if (loading || !copy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (notFound || !trip) {
    return (
      <>
        <HeaderHero
          className="h-[40vh]!"
          description={copy.notFoundDescription}
          fallbackImage="/images/hero-image-1.jpeg"
          title={copy.notFoundTitle}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <Section>
          <div className="mx-auto max-w-2xl text-center py-12">
            <Button asChild variant="ghost" size="sm">
              <Link href={pathForLocale(locale as Locale, "/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
                {copy.backToDashboard}
              </Link>
            </Button>
          </div>
        </Section>
      </>
    );
  }

  const isRevealed =
    trip.status === "REVEALED" || trip.status === "COMPLETED";

  // ── Post-reveal state ────────────────────────────────────────────────────────
  if (isRevealed) {
    const destination =
      trip.actualDestination ??
      (trip.experience?.destinationCity && trip.experience?.destinationCountry
        ? `${trip.experience.destinationCity}, ${trip.experience.destinationCountry}`
        : null) ??
      copy.revealedTitle;

    const heroImage =
      trip.experience?.heroImage ?? "/images/hero-image-1.jpeg";

    return (
      <>
        <HeaderHero
          className="h-[65vh]!"
          description={copy.revealedSubtitle}
          fallbackImage={heroImage}
          title={destination}
          videoSrc="/videos/hero-video-1.mp4"
        />

        <Section>
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <Button asChild size="sm" variant="ghost">
                <Link href={pathForLocale(locale as Locale, `/dashboard/trips/${tripId}`)}>
                  <ArrowLeft className="h-4 w-4" />
                  {copy.backToDashboard}
                </Link>
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {trip.experience?.heroImage && (
                <div className="w-full aspect-video overflow-hidden">
                  <Img
                    alt={destination}
                    src={trip.experience.heroImage}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              )}

              <div className="p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-light-blue mb-3">
                  {copy.revealedEyebrow}
                </p>

                <h2 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase leading-none mb-4">
                  {destination}
                </h2>

                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-8">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {new Date(trip.startDate).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <Button asChild>
                  <Link
                    href={pathForLocale(
                      locale as Locale,
                      `/dashboard/trips/${tripId}/details`,
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                    {copy.viewItinerary}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </>
    );
  }

  // ── Pre-reveal state (CONFIRMED) ─────────────────────────────────────────────
  const isPendingAssignment =
    countdown?.revealed === true && trip.status === "CONFIRMED";

  const pad = (n: number) => String(n).padStart(2, "0");

  const units = countdown
    ? [
        { label: copy.daysLabel, value: String(countdown.days) },
        { label: copy.hoursLabel, value: pad(countdown.hours) },
        { label: copy.minutesLabel, value: pad(countdown.minutes) },
        { label: copy.secondsLabel, value: pad(countdown.seconds) },
      ]
    : [];

  return (
    <>
      <HeaderHero
        className="h-[55vh]!"
        description={copy.pageDescription}
        fallbackImage="/images/hero-image-1.jpeg"
        title={copy.pageTitle}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <Section
        title={`${copy.countdownTitle}`}
        subtitle={isPendingAssignment ? copy.pendingAssignment : copy.countdownSubtitle}
      >
        {isPendingAssignment ? (
          <motion.div
            className="flex flex-col items-center gap-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 border border-yellow-200">
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="mt-4 flex items-end justify-center"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            role="timer"
          >
            {units.map((unit, i) => (
              <div
                key={unit.label}
                className="flex items-end font-barlow-condensed font-extralight"
              >
                <div className="inline-flex items-end">
                  <span className="leading-none tabular-nums text-neutral-800 text-[52px] sm:text-[80px] md:text-[140px]">
                    {i > 0 && ":"}
                    {unit.value}
                  </span>
                  <span className="mb-[0.3rem] ml-0.5 whitespace-nowrap uppercase tracking-[0.18em] text-neutral-400 sm:mb-[0.45rem] md:mb-[0.6rem] text-xs sm:text-base md:text-xl font-normal">
                    {unit.label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Departure date */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-1.5 text-sm text-neutral-400"
          initial={{ opacity: 0 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {new Date(trip.startDate).toLocaleDateString(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </motion.div>

        {/* Back link */}
        <motion.div
          className="mt-10 flex justify-center"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Button asChild variant="ghost" size="sm">
            <Link href={pathForLocale(locale as Locale, `/dashboard/trips/${tripId}`)}>
              <ArrowLeft className="h-4 w-4" />
              {copy.backToDashboard}
            </Link>
          </Button>
        </motion.div>
      </Section>
    </>
  );
}

const RevealPage = dynamic(() => Promise.resolve(RevealContent), {
  ssr: false,
});

export default function TripRevealPage() {
  return (
    <SecureRoute>
      <RevealPage />
    </SecureRoute>
  );
}
