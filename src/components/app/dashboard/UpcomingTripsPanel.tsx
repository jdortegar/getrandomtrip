import Link from "next/link";
import { Calendar, Eye, MapPin, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "./types";

interface UpcomingTripsPanelProps {
  copy: DashboardCopy;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  trips: Trip[];
}

export function UpcomingTripsPanel({
  copy,
  getStatusColor,
  getStatusLabel,
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
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-neutral-400 transition-colors"
                key={trip.id}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-neutral-900">
                        {trip.actualDestination ||
                          copy.allTrips.emptyDestination}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(trip.status)}`}
                      >
                        {getStatusLabel(trip.status)}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-neutral-500">
                      {copy.common.id}: {trip.id}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {trip.city}, {trip.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/trips/${trip.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      {copy.upcomingTrips.viewDetails}
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-neutral-600">
                    {trip.type} • {trip.level}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    ${(trip.totalTripUsd ?? 0).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
