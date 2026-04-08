import Link from 'next/link';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Trip } from '@/lib/utils/trips';
import type { DashboardCopy } from './types';

interface AllTripsGridProps {
  copy: DashboardCopy;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  trips: Trip[];
}

export function AllTripsGrid({
  copy,
  getStatusColor,
  getStatusLabel,
  trips,
}: AllTripsGridProps) {
  if (trips.length === 0) return null;

  return (
    <div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {copy.allTrips.title}
          </h2>
          <span className="text-sm text-neutral-600">
            {trips.length} {copy.allTrips.totalLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <div
              className="p-4 border border-gray-200 rounded-lg hover:border-neutral-400 transition-colors"
              key={trip.id}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {trip.actualDestination || copy.allTrips.emptyDestination}
                  </h3>
                  <p className="mb-1 text-xs text-neutral-500">
                    {copy.common.id}: {trip.id}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {copy.allTrips.from} {trip.city}, {trip.country}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(trip.status)}`}
                >
                  {getStatusLabel(trip.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                <span className="flex items-center gap-1">
                  {new Date(trip.startDate).toLocaleDateString()}
                  <ArrowRight className="h-3 w-3" />
                  {new Date(trip.endDate).toLocaleDateString()}
                </span>
                {trip.customerRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{trip.customerRating}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm font-medium text-neutral-900">
                  ${(trip.totalTripUsd ?? 0).toFixed(0)}
                </span>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/trips/${trip.id}`}>
                    {copy.allTrips.viewMore}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
