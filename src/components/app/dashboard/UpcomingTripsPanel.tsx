import Link from "next/link";
import { Calendar, Eye, MapPin, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Img from "@/components/common/Img";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "./types";

interface UpcomingTripsPanelProps {
  copy: DashboardCopy;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  locale: string;
  trips: Trip[];
}

export function UpcomingTripsPanel({
  copy,
  getStatusColor,
  getStatusLabel,
  locale,
  trips,
}: UpcomingTripsPanelProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {copy.upcomingTrips.title}
          </h2>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">
              {copy.upcomingTrips.emptyTitle}
            </h3>
            <p className="text-neutral-500 mb-4">
              {copy.upcomingTrips.emptyMessage}
            </p>
            <Button asChild size="md">
              <Link href="/journey">
                <Plus className="w-4 h-4" />
                {copy.upcomingTrips.emptyCta}
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => {
              const { levelName, travelerTypeTitle, typeImageSrc } =
                getTripExperienceDisplay(trip, locale);
              return (
                <li key={trip.id}>
                  <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md p-3">
                    <div className="w-[100px] h-[120px] rounded-lg overflow-hidden">
                      <Img
                        alt={travelerTypeTitle}
                        height={120}
                        sizes="(max-width: 640px) 34vw, 160px"
                        src={typeImageSrc!}
                        width={100}
                      />
                    </div>

                    {/* Travel type + level */}
                    <div className="min-w-0 flex-1 space-y-1 px-4 py-3 text-left">
                      <p className="text-base font-bold leading-tight text-neutral-900">
                        <span>{copy.unpaidTrips.travelTypeSection}</span>
                        <span className="px-1.5 font-normal text-neutral-400">
                          {copy.unpaidTrips.travelTypeTitleSeparator}
                        </span>
                        <span className="text-sky-600">
                          {travelerTypeTitle}
                        </span>
                      </p>
                      <p className="text-sm text-neutral-500">
                        {copy.unpaidTrips.experienceSection}{" "}
                        <span className="font-bold text-neutral-900">
                          {levelName}
                        </span>
                      </p>
                    </div>

                    {/* Location + date + status */}
                    <div className="min-w-0 flex-1 space-y-1 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-neutral-900">
                          {trip.actualDestination ||
                            copy.allTrips.emptyDestination}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {trip.city}, {trip.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(trip.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex shrink-0 flex-col items-end justify-center gap-2 px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(trip.status)}`}
                      >
                        {getStatusLabel(trip.status)}
                      </span>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/trips/${trip.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                          {copy.upcomingTrips.viewDetails}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
