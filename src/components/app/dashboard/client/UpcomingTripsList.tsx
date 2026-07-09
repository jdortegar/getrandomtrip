"use client";

import { Calendar, Clock, Eye, MapPin, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TableIconLink } from "@/components/ui/TableIconButton";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import type { Locale } from "@/lib/i18n/config";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "@/components/app/dashboard/types";

interface UpcomingTripsListProps {
  copy: DashboardCopy;
  locale: string;
  trips: Trip[];
}

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  CONFIRMED: {
    dot: "bg-blue-500",
    badge: "border-blue-200 bg-blue-50 text-blue-800",
  },
  REVEALED: {
    dot: "bg-purple-500",
    badge: "border-purple-200 bg-purple-50 text-purple-800",
  },
};
const DEFAULT_STATUS_STYLE = {
  dot: "bg-gray-400",
  badge: "border-gray-200 bg-gray-50 text-gray-700",
};

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
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.upcomingTrips.title}
        </h2>
        <Link
          className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-light-blue hover:text-sky-700"
          href={pathForLocale(locale as Locale, "/dashboard/client/trips")}
        >
          {copy.allTrips.viewMore} →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-700">
              {copy.upcomingTrips.emptyTitle}
            </p>
            <p className="text-sm text-neutral-500">
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
              const { levelName, travelerTypeTitle } = getTripExperienceDisplay(
                trip,
                locale,
              );
              const startDate = new Date(trip.startDate).toLocaleDateString(
                dateLocale,
                { day: "numeric", month: "short", year: "numeric" },
              );
              const statusLabel =
                copy.tripStatus[trip.status as keyof typeof copy.tripStatus] ??
                trip.status;
              const s = STATUS_STYLES[trip.status] ?? DEFAULT_STATUS_STYLE;

              return (
                <div className="px-5 py-4" key={trip.id}>
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {trip.actualDestination ?? copy.allTrips.emptyDestination}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {travelerTypeTitle} · {levelName}
                      </p>
                    </div>
                    <span
                      className={`hidden shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex ${s.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                      {statusLabel}
                    </span>
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
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {trip.city}, {trip.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {startDate}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] sm:hidden ${s.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                      {statusLabel}
                    </span>
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
