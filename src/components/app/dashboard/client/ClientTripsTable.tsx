"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Eye, MapPin, Plane, Plus, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TableIconLink } from "@/components/ui/TableIconButton";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import type { Locale } from "@/lib/i18n/config";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import type { ClientDashboardDict } from "@/lib/types/dictionary";

type StatusFilter = "all" | "upcoming" | "completed";

interface StatusBadgeProps {
  label: string;
  status: string;
}

function StatusBadge({ label, status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    CANCELLED:
      "border-red-200 bg-red-50 text-red-800 [--dot:theme(colors.red.500)]",
    COMPLETED:
      "border-green-200 bg-green-50 text-green-800 [--dot:theme(colors.green.500)]",
    CONFIRMED:
      "border-blue-200 bg-blue-50 text-blue-800 [--dot:theme(colors.blue.500)]",
    REVEALED:
      "border-purple-200 bg-purple-50 text-purple-800 [--dot:theme(colors.purple.500)]",
  };
  const cls =
    styles[status] ??
    "border-gray-200 bg-gray-50 text-gray-700 [--dot:theme(colors.gray.400)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${cls}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--dot)" />
      {label}
    </span>
  );
}

interface ClientTripsTableProps {
  copy: DashboardCopy;
  locale: string;
  pageCopy: ClientDashboardDict["trips"];
  trips: Trip[];
}

export function ClientTripsTable({
  copy,
  locale,
  pageCopy,
  trips,
}: ClientTripsTableProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = trips.filter((t) => {
    if (filter === "upcoming")
      return t.status === "CONFIRMED" || t.status === "REVEALED";
    if (filter === "completed") return t.status === "COMPLETED";
    return true;
  });

  const filterOptions: Array<{ id: StatusFilter; label: string }> = [
    { id: "all", label: pageCopy.filterAll },
    { id: "upcoming", label: pageCopy.filterUpcoming },
    { id: "completed", label: pageCopy.filterCompleted },
  ];

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
        <Plane className="h-14 w-14 text-neutral-300" />
        <div>
          <p className="text-sm font-semibold text-neutral-700">
            {copy.upcomingTrips.emptyTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {copy.upcomingTrips.emptyMessage}
          </p>
        </div>
        <Button asChild size="md">
          <Link href="/journey">
            <Plus className="h-4 w-4" />
            {copy.upcomingTrips.emptyCta}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((opt) => (
            <button
              className={`h-9 rounded-lg border px-4 text-[13px] font-medium transition-colors ${
                filter === opt.id
                  ? "border-light-blue bg-light-blue text-white"
                  : "border-gray-200 bg-white text-neutral-600 shadow-sm hover:border-gray-300"
              }`}
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[13px] text-neutral-400">
          {filtered.length} {pageCopy.of} {trips.length} {pageCopy.tripsCount}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Trip
                </th>
                <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:table-cell">
                  Destination
                </th>
                <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:table-cell">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </span>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-sm text-neutral-500"
                    colSpan={5}
                  >
                    No trips match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((trip) => {
                  const { levelName, travelerTypeTitle } =
                    getTripExperienceDisplay(trip, locale);
                  const startDate = new Date(trip.startDate).toLocaleDateString(
                    locale.startsWith("en") ? "en-US" : "es-ES",
                    { day: "numeric", month: "short", year: "numeric" },
                  );
                  const statusLabel =
                    copy.tripStatus[
                      trip.status as keyof typeof copy.tripStatus
                    ] ?? trip.status;

                  return (
                    <tr
                      className="transition-colors hover:bg-gray-50"
                      key={trip.id}
                    >
                      {/* Trip */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          {travelerTypeTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {levelName}
                        </p>
                      </td>

                      {/* Destination */}
                      <td className="hidden px-5 py-4 sm:table-cell">
                        <p className="text-sm font-semibold text-neutral-900">
                          {trip.actualDestination ??
                            copy.allTrips.emptyDestination}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {trip.city}, {trip.country}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="hidden px-5 py-4 text-sm text-neutral-500 md:table-cell">
                        {startDate}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge label={statusLabel} status={trip.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
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
                          {trip.status === "COMPLETED" &&
                            trip.reviewToken &&
                            !trip.reviewSubmittedAt && (
                              <TableIconLink
                                href={pathForLocale(
                                  locale as Locale,
                                  `/review/${trip.reviewToken}`,
                                )}
                                title={copy.upcomingTrips.writeReview}
                              >
                                <Star className="h-4 w-4" />
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
