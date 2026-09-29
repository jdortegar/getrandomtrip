"use client";

import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { Calendar, Clock, Eye, MapPin, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { TableIconLink } from "@/components/ui/TableIconButton";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import type { Locale } from "@/lib/i18n/config";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "@/components/app/dashboard/types";

interface UpcomingTripsListProps {
  copy: DashboardCopy;
  locale: string;
  trips: Trip[];
}

export function UpcomingTripsList({
  copy,
  locale,
  trips,
}: UpcomingTripsListProps) {
  const dateLocale = locale.toLowerCase().startsWith("en") ? "en-US" : "es-ES";
  const upcoming = trips
    .filter((t) => t.status === "CONFIRMED" || t.status === "REVEALED")
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .slice(0, 4);

  return (
    <section data-component="UpcomingTripsList">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {copy.upcomingTrips.title}
        </h2>
        <Link
          className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary hover:text-sky-700"
          href={pathForLocale(locale as Locale, "/dashboard/traveler/trips")}
        >
          {copy.allTrips.viewMore} →
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-700">
              {copy.upcomingTrips.emptyTitle}
            </p>
            <p className="text-sm text-ink">
              {copy.upcomingTrips.emptyMessage}
            </p>
            <Button asChild className="mt-1" size="sm">
              <Link href={pathForLocale(locale as Locale, "/journey")}>
                <Plus className="h-4 w-4" />
                {copy.upcomingTrips.emptyCta}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((trip) => {
              const { levelName, travelerTypeTitle, typeImageSrc } =
                getTripExperienceDisplay(trip, locale);
              const startDate = new Date(trip.startDate).toLocaleDateString(
                dateLocale,
                { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
              );
              const statusLabel =
                copy.tripStatus[trip.status as keyof typeof copy.tripStatus] ??
                trip.status;

              return (
                <div className="px-5 py-4" key={trip.id}>
                  <div className="flex items-center gap-4">
                    {typeImageSrc && (
                      <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-lg sm:block">
                        <Img
                          alt={travelerTypeTitle}
                          className="h-full w-full object-cover"
                          sizes="48px"
                          src={typeImageSrc}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {(isFulfillmentVisible(trip.status, false) ? trip.actualDestination : null) ?? copy.allTrips.emptyDestination}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink">
                        {travelerTypeTitle} · {levelName}
                      </p>
                    </div>
                    <span className="hidden shrink-0 sm:inline-flex"><StatusIndicatorBadge family="traveler-trip" label={statusLabel} status={trip.status} /></span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {trip.status === "CONFIRMED" && (
                        <TableIconLink
                          href={pathForLocale(
                            locale as Locale,
                            `/dashboard/trips/${trip.id}/reveal`,
                          )}
                          title={copy.upcomingTrips.revealCountdown}
                        >
                          <Clock className="h-4 w-4" />
                        </TableIconLink>
                      )}
                      {trip.status === "REVEALED" && (
                        <TableIconLink
                          href={pathForLocale(
                            locale as Locale,
                            `/dashboard/trips/${trip.id}/reveal`,
                          )}
                          title={copy.upcomingTrips.revealDestination}
                        >
                          <Sparkles className="h-4 w-4" />
                        </TableIconLink>
                      )}
                      <TableIconLink
                        href={pathForLocale(
                          locale as Locale,
                          `/dashboard/trips/${trip.id}`,
                        )}
                        title={copy.upcomingTrips.viewDetails}
                      >
                        <Eye className="h-4 w-4" />
                      </TableIconLink>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-ink">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {copy.allTrips.from} {trip.city}, {trip.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {startDate}
                    </span>
                    <span className="inline-flex shrink-0 sm:hidden"><StatusIndicatorBadge family="traveler-trip-summary" label={statusLabel} status={trip.status} /></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
