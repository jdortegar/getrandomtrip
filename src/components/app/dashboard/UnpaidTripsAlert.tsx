"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, CreditCard, MapPin, Pencil, Trash2 } from "lucide-react";
import {
  TableIconButton,
  TableIconLink,
} from "@/components/ui/TableIconButton";
import Img from "@/components/common/Img";
import {
  getTripExperienceDisplay,
  getTripPriceParts,
  formatTripReferenceTail,
} from "@/lib/helpers/dashboard-trip-display";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "./types";

function usd(n: number): string {
  return `USD ${Math.round(n)}`;
}

function buildEditUrl(locale: string, trip: Trip): string {
  const params = new URLSearchParams();
  if (trip.type) params.set("travelType", trip.type);
  if (trip.level) params.set("experience", trip.level);
  if (trip.country) params.set("originCountry", trip.country);
  if (trip.city) params.set("originCity", trip.city);
  if (trip.startDate)
    params.set("startDate", trip.startDate.split("T")[0] ?? trip.startDate);
  if (trip.nights) params.set("nights", String(trip.nights));
  if (trip.transport) params.set("transportOrder", trip.transport);
  return `/${locale}/journey?${params.toString()}`;
}

interface UnpaidTripsAlertProps {
  copy: DashboardCopy;
  locale: string;
  onDelete: (tripId: string) => Promise<void>;
  trips: Trip[];
}

export function UnpaidTripsAlert({
  copy,
  locale,
  onDelete,
  trips,
}: UnpaidTripsAlertProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (trips.length === 0) return null;

  const dateLocale = locale.toLowerCase().startsWith("en") ? "en-US" : "es-ES";

  async function handleDelete(tripId: string) {
    if (!confirm(copy.unpaidTrips.deleteConfirm)) return;
    setDeletingId(tripId);
    try {
      await onDelete(tripId);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      {/* Section header */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {trips.length} pending
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.unpaidTrips.title}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">{copy.unpaidTrips.message}</p>
      </div>

      {/* Panel card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Amber urgency stripe */}
        <div className="h-1 bg-amber-400" />

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Trip
                </th>
                <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:table-cell">
                  Origin
                </th>
                <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:table-cell">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </span>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Amount
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trips.map((trip) => {
                const { total } = getTripPriceParts(trip);
                const { levelName, travelerTypeTitle, typeImageSrc } =
                  getTripExperienceDisplay(trip, locale);
                const start = trip.startDate
                  ? new Date(trip.startDate).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                const ref = formatTripReferenceTail(trip.id);

                return (
                  <tr
                    className="transition-colors hover:bg-gray-50"
                    key={trip.id}
                  >
                    {/* Trip */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
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
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">
                            {travelerTypeTitle}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {levelName}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-neutral-400">
                            …{ref}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Origin */}
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <p className="flex items-center gap-1 text-sm text-neutral-700">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        {trip.city}, {trip.country}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="hidden px-5 py-4 text-sm text-neutral-500 md:table-cell">
                      {start}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <p className="font-barlow-condensed text-lg font-bold leading-none text-gray-900">
                        {usd(total)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <TableIconLink
                          href={`/${locale}/checkout?tripId=${trip.id}`}
                          title={copy.unpaidTrips.action}
                        >
                          <CreditCard className="h-4 w-4" />
                        </TableIconLink>
                        <TableIconLink
                          href={buildEditUrl(locale, trip)}
                          title={copy.unpaidTrips.editAction}
                        >
                          <Pencil className="h-4 w-4" />
                        </TableIconLink>
                        <TableIconButton
                          danger
                          disabled={deletingId === trip.id}
                          title={copy.unpaidTrips.deleteAction}
                          onClick={() => handleDelete(trip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </TableIconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
