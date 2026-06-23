"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import HeaderHero from "@/components/journey/HeaderHero";
import Section from "@/components/layout/Section";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import SecureRoute from "@/components/auth/SecureRoute";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import type { TripItineraryDict } from "@/lib/types/dictionary";

interface ItineraryDayEntry {
  title: string;
  description: string;
  image: string | null;
}

interface TripWithExperience {
  id: string;
  status: string;
  experience?: {
    id: string;
    title: string;
    itinerary: ItineraryDayEntry[] | null;
    inclusions: unknown[] | null;
    exclusions: unknown[] | null;
  } | null;
}

function ItineraryContent() {
  const params = useParams();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripWithExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [copy, setCopy] = useState<TripItineraryDict | null>(null);

  const tripId = params.id as string;
  const rawLocale = (params.locale as string) ?? "es";
  const locale = hasLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  useEffect(() => {
    getDictionary(locale).then((d) => setCopy(d.tripItinerary));
  }, [locale]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTrip(data.trip as TripWithExperience);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, tripId]);

  if (loading || !copy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  const itinerary = trip?.experience?.itinerary ?? null;
  const hasItinerary = Array.isArray(itinerary) && itinerary.length > 0;
  const inclusions = (trip?.experience?.inclusions ?? []).map(String).filter(Boolean);
  const exclusions = (trip?.experience?.exclusions ?? []).map(String).filter(Boolean);

  return (
    <>
      <HeaderHero
        className="h-[50vh]!"
        description={trip?.experience?.title ?? copy.title}
        fallbackImage="/images/hero-image-1.jpeg"
        title={copy.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          {/* Back link */}
          <div className="mb-6">
            <Button asChild size="sm" variant="ghost">
              <Link href={`/${locale}/dashboard/trips/${tripId}`}>
                <ArrowLeft className="h-4 w-4" />
                {copy.backToTrip}
              </Link>
            </Button>
          </div>

          {/* No experience assigned */}
          {!trip?.experience && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
              <Calendar className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">{copy.noExperience}</p>
            </div>
          )}

          {/* Experience assigned but no itinerary */}
          {trip?.experience && !hasItinerary && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
              <Calendar className="h-10 w-10 text-gray-300" />
              <h3 className="text-lg font-semibold text-neutral-900">
                {copy.emptyTitle}
              </h3>
              <p className="max-w-sm text-sm text-gray-500">
                {copy.emptyDescription}
              </p>
            </div>
          )}

          {/* Itinerary days */}
          {hasItinerary && (
            <ol className="flex flex-col gap-4">
              {(itinerary as ItineraryDayEntry[]).map((day, index) => (
                <li
                  key={index}
                  className="flex gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      {copy.day} {index + 1}
                    </p>
                    <h3 className="text-base font-semibold text-neutral-900">
                      {day.title}
                    </h3>
                    {day.description && (
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {day.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* Inclusions / Exclusions */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-semibold text-neutral-900">
                    {copy.inclusions}
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-green-500">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {exclusions.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-semibold text-neutral-900">
                    {copy.exclusions}
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {exclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-red-400">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

const ItineraryPage = dynamic(() => Promise.resolve(ItineraryContent), {
  ssr: false,
});

export default function TripItineraryPage() {
  return (
    <SecureRoute>
      <ItineraryPage />
    </SecureRoute>
  );
}
