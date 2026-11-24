"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Moon,
  Users,
} from "lucide-react";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripDetailDict, TripItineraryDict } from "@/lib/types/dictionary";
import { isAwaitingReveal } from "@/lib/utils/trips";
import type { TripDetailsData } from "@/types/tripDetails";
import {
  formatTripDateRange,
  resolveTripDestination,
} from "./tripDetailsHelpers";

interface TripDetailsHeaderProps {
  backHref: string;
  /** Status line under the title (`TripStatusBar`). */
  statusBar?: ReactNode;
  copy: TripDetailDict;
  heroCopy: TripItineraryDict["hero"];
  locale: string;
  /** Link to the reveal page; only passed once the destination is revealed. */
  revealHref?: string;
  trip: TripDetailsData;
}

/**
 * Compact header for the trip-details page — the reveal page's look (Ground
 * background, Deep Teal, condensed uppercase title) without its full-height
 * hero. Same status rules as `TripDetailsHero`: before the reveal the
 * destination stays a placeholder and no photo is shown, even if an
 * experience is already assigned; once revealed, the experience photo shows
 * as a thumbnail.
 */
export function TripDetailsHeader({
  backHref,
  copy,
  heroCopy,
  locale,
  revealHref,
  statusBar,
  trip,
}: TripDetailsHeaderProps) {
  const isPreReveal = isAwaitingReveal(trip.status);
  const isCancelled = trip.status === "CANCELLED";

  const eyebrow = isCancelled
    ? heroCopy.eyebrowCancelled
    : trip.status === "COMPLETED"
      ? heroCopy.eyebrowCompleted
      : isPreReveal
        ? heroCopy.eyebrowConfirmed
        : heroCopy.eyebrowRevealed;

  const destination = isPreReveal
    ? heroCopy.destinationFallback
    : resolveTripDestination(trip, heroCopy.destinationFallback);
  const thumbnail = revealHref ? trip.experience?.heroImage : null;
  const dateRange = formatTripDateRange(trip.startDate, trip.endDate, locale);
  const origin = [trip.originCity, trip.originCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <header
      className="border-b border-primary/20 bg-ground"
      data-component="TripDetailsHeader"
    >
      <div className="rt-container py-6 text-left md:py-8">
        <div className="mx-auto max-w-6xl">
          <Button
            asChild
            className="-ml-3 justify-start"
            size="sm"
            variant="ghost"
          >
            <Link href={backHref}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {copy.backToDashboard}
            </Link>
          </Button>

          <div className="mt-3 flex items-center gap-4 md:gap-6">
            {thumbnail ? (
              <Img
                alt=""
                aria-hidden="true"
                className="h-20 w-20 shrink-0 rounded-xl object-cover md:h-28 md:w-28"
                height={112}
                src={thumbnail}
                width={112}
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {isCancelled ? null : (
                  <span
                    aria-hidden="true"
                    className="mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-feature"
                  />
                )}
                {eyebrow}
              </p>

              <h1 className="mt-2 break-words font-barlow-condensed text-4xl font-bold uppercase leading-none text-ink md:text-6xl">
                {destination}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600">
                {origin ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      aria-hidden="true"
                      className="h-4 w-4 text-primary"
                    />
                    <span className="sr-only">{copy.departureFromLabel}: </span>
                    {origin}
                  </span>
                ) : null}
                {dateRange ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar
                      aria-hidden="true"
                      className="h-4 w-4 text-primary"
                    />
                    {dateRange}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Moon aria-hidden="true" className="h-4 w-4 text-primary" />
                  {interpolateTemplate(copy.nightsCount, {
                    n: String(trip.nights),
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users aria-hidden="true" className="h-4 w-4 text-primary" />
                  {interpolateTemplate(heroCopy.travelers, {
                    n: String(trip.pax),
                  })}
                </span>
              </div>
            </div>

            {revealHref ? (
              <ButtonV2
                asChild
                className="hidden shrink-0 self-end md:inline-flex"
                size="sm"
              >
                <Link href={revealHref}>
                  {copy.viewRevelationAction}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </ButtonV2>
            ) : null}
          </div>

          {revealHref ? (
            <ButtonV2
              asChild
              className="mt-5 w-full justify-between md:hidden"
              size="sm"
            >
              <Link href={revealHref}>
                {copy.viewRevelationAction}
                <ArrowRight aria-hidden="true" />
              </Link>
            </ButtonV2>
          ) : null}

          {statusBar ? (
            <div className="mt-6 border-t border-primary/20 pt-4">
              {statusBar}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
