import Link from "next/link";
import { ArrowRight, MapPin, Moon, Star, Users } from "lucide-react";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";
import type { Locale } from "@/lib/i18n/config";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "@/components/app/dashboard/types";

interface TravelerTripRowProps {
  copy: DashboardCopy;
  locale: string;
  trip: Trip;
}

/**
 * One trip in the traveler's trips list, as a boarding-pass style card: a
 * departure-date stub, the destination (a placeholder until revealed) with
 * the experience and trip facts, then the status and the trip's actions.
 */
export function TravelerTripRow({ copy, locale, trip }: TravelerTripRowProps) {
  const { levelName, travelerTypeTitle } = getTripExperienceDisplay(
    trip,
    locale,
  );
  // XSED's level already carries the type ("XSED Drop"), so skip the prefix.
  const experienceLabel = levelName
    .toLowerCase()
    .startsWith(travelerTypeTitle.toLowerCase())
    ? levelName
    : `${travelerTypeTitle} · ${levelName}`;
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const start = new Date(trip.startDate);
  const part = (options: Intl.DateTimeFormatOptions) =>
    start.toLocaleDateString(dateLocale, { timeZone: "UTC", ...options });
  const startDate = part({ day: "numeric", month: "short", year: "numeric" });
  // The stub shows the start date, so the facts line shows the trip's length.
  const nights =
    trip.nights ??
    Math.max(
      0,
      Math.round(
        (new Date(trip.endDate).getTime() - start.getTime()) / 86_400_000,
      ),
    );
  const nightsLabel =
    nights === 1
      ? copy.allTrips.nightOne
      : interpolateTemplate(copy.allTrips.nights, { n: String(nights) });
  const statusLabel = copy.tripStatus[trip.status] ?? trip.status;
  const destination =
    (isFulfillmentVisible(trip.status, false)
      ? trip.actualDestination
      : null) ?? copy.allTrips.emptyDestination;
  const isPreReveal = destination === copy.allTrips.emptyDestination;
  const canViewDestination =
    trip.status === "REVEALED" || trip.status === "COMPLETED";
  const canReview =
    trip.status === "COMPLETED" &&
    !!trip.reviewToken &&
    !trip.reviewSubmittedAt;
  const href = (path: string) => pathForLocale(locale as Locale, path);

  return (
    <li
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-6 sm:p-5"
      data-component="TravelerTripRow"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center sm:gap-5">
        {/* Departure stub */}
        <div
          aria-hidden="true"
          className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-ground py-2.5 font-barlow-condensed uppercase leading-none text-ink sm:w-[72px]"
        >
          <span className="text-xs font-semibold tracking-[0.12em] text-primary">
            {part({ month: "short" }).replace(".", "")}
          </span>
          <span className="mt-1 text-3xl font-bold sm:text-4xl">
            {part({ day: "numeric" })}
          </span>
          <span className="mt-1 text-xs text-neutral-500">
            {part({ year: "numeric" })}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Mobile: the badge leads the text column so it shares its left edge. */}
          <div className="mb-2 sm:hidden">
            <StatusIndicatorBadge
              family="traveler-trip"
              label={statusLabel}
              status={trip.status}
            />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {experienceLabel}
          </p>
          <p
            className={`mt-1 truncate font-barlow-condensed text-2xl font-bold uppercase leading-none ${
              isPreReveal ? "text-primary" : "text-ink"
            }`}
          >
            {destination}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              {copy.allTrips.from} {trip.city}, {trip.country}
            </span>
            {/* The date stub is aria-hidden, so screen readers get it here. */}
            <span className="sr-only">{startDate}</span>
            {nights > 0 && (
              <span className="inline-flex items-center gap-1">
                <Moon aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                {nightsLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              {interpolateTemplate(copy.allTrips.travelers, {
                n: String(trip.pax),
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:items-end sm:border-0 sm:pt-0">
        <div className="hidden sm:block">
          <StatusIndicatorBadge
            family="traveler-trip"
            label={statusLabel}
            status={trip.status}
          />
        </div>
        {canReview ? (
          /* A completed, unreviewed trip has one job left: the review leads,
             the destination drops to outline and details to a quiet link. */
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Link
              className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-feature"
              href={href(`/dashboard/trips/${trip.id}`)}
            >
              {copy.upcomingTrips.viewDetails}
            </Link>
            <ButtonV2
              asChild
              className="justify-center"
              size="sm"
              variant="outline"
            >
              <Link href={href(`/dashboard/trips/${trip.id}/destination`)}>
                {copy.upcomingTrips.revealDestination}
              </Link>
            </ButtonV2>
            <ButtonV2 asChild className="col-span-2 justify-center" size="sm">
              <Link href={href(`/review/${trip.reviewToken}`)}>
                <Star aria-hidden="true" />
                {copy.upcomingTrips.writeReview}
              </Link>
            </ButtonV2>
          </div>
        ) : (
          <div
            className={`grid w-full gap-2 sm:flex sm:w-auto sm:items-center ${
              canViewDestination ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <ButtonV2
              asChild
              className="justify-center"
              size="sm"
              variant="outline"
            >
              <Link href={href(`/dashboard/trips/${trip.id}`)}>
                {copy.upcomingTrips.viewDetails}
              </Link>
            </ButtonV2>
            {canViewDestination && (
              <ButtonV2 asChild className="justify-center" size="sm">
                <Link href={href(`/dashboard/trips/${trip.id}/destination`)}>
                  {copy.upcomingTrips.revealDestination}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </ButtonV2>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
