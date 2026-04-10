"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import {
  getTripExperienceDisplay,
  getTripPriceParts,
} from "@/lib/helpers/dashboard-trip-display";
import { cn } from "@/lib/utils";
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
  /** Persist removal (e.g. DELETE /api/trips/:id) then update parent state. */
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
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AlertCircle aria-hidden className="h-5 w-5 shrink-0 text-amber-700" />
        <h2 className="text-xl font-semibold text-neutral-900">
          {copy.unpaidTrips.title}
        </h2>
        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
          {trips.length}
        </span>
        <p className="w-full text-sm font-normal text-neutral-600">
          {copy.unpaidTrips.message}
        </p>
      </div>

      {/* Trip rows */}
      <ul className="space-y-3">
        {trips.map((trip) => {
          const { isEstimate, perPerson, total } = getTripPriceParts(trip);
          const { levelName, travelerTypeTitle, typeImageSrc } =
            getTripExperienceDisplay(trip, locale);
          const start = trip.startDate
            ? new Date(trip.startDate).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          return (
            <li key={trip.id}>
              <div
                className={cn(
                  "flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm",
                  "transition-all duration-300 hover:shadow-md p-3",
                )}
              >
                <div className="w-[100px] h-[120px] rounded-lg overflow-hidden">
                  <Img
                    alt={travelerTypeTitle}
                    sizes="(max-width: 640px) 34vw, 160px"
                    src={typeImageSrc!}
                    className="object-cover h-full w-full"
                  />
                </div>

                {/* Trip info */}
                <div className="min-w-0 flex-1 space-y-1 px-4 py-3 text-left">
                  <p className="font-barlow text-lg font-bold leading-tight text-neutral-900 sm:text-xl">
                    <span>{copy.unpaidTrips.travelTypeSection}</span>
                    <span className="px-1.5 font-normal text-neutral-400">
                      {copy.unpaidTrips.travelTypeTitleSeparator}
                    </span>
                    <span className="text-sky-600">{travelerTypeTitle}</span>
                  </p>
                  <p className="font-barlow text-sm font-normal text-neutral-500 sm:text-base">
                    {copy.unpaidTrips.experienceSection}{" "}
                    <span className="font-bold text-neutral-900">
                      {levelName}
                    </span>
                  </p>
                </div>
                <div className="min-w-0 flex-1 space-y-1 px-4 py-3 text-left">
                  <p className="pt-0.5 text-xs text-neutral-400">
                    {copy.unpaidTrips.bookingRefLabel}:{" "}
                    <span className="font-medium text-neutral-500">
                      {trip.id}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <MapPin aria-hidden className="h-3 w-3 shrink-0" />
                      {trip.city}, {trip.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar aria-hidden className="h-3 w-3 shrink-0" />
                      {start}
                    </span>
                  </div>
                </div>

                {/* Price + CTAs */}
                <div className="flex shrink-0 flex-col items-end justify-center gap-2 px-4 py-3">
                  <p className="font-barlow-condensed text-2xl font-bold text-neutral-900 sm:text-3xl">
                    {usd(total)}
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button asChild size="sm">
                      <Link href={`/${locale}/checkout?tripId=${trip.id}`}>
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        {copy.unpaidTrips.action}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="text-primary hover:bg-gray-50 hover:text-gray-700 border-primary"
                    >
                      <Link href={buildEditUrl(locale, trip)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      disabled={deletingId === trip.id}
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(trip.id)}
                      className="text-red-400 hover:bg-red-50 hover:text-red-700 border-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
