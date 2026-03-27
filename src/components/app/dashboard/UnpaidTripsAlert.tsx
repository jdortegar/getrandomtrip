import Link from 'next/link';
import { AlertCircle, Calendar, CreditCard, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Trip } from '@/lib/utils/trips';
import type { DashboardCopy } from './types';

interface UnpaidTripsAlertProps {
  copy: DashboardCopy;
  locale: string;
  trips: Trip[];
}

export function UnpaidTripsAlert({ copy, locale, trips }: UnpaidTripsAlertProps) {
  if (trips.length === 0) return null;

  return (
    <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <AlertCircle className="h-6 w-6 text-amber-700" />
        <h2 className="text-xl font-semibold text-neutral-900">
          {copy.unpaidTrips.title}
        </h2>
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-sm font-medium text-amber-900">
          {trips.length}
        </span>
      </div>
      <p className="mb-4 text-sm text-neutral-700">
        {copy.unpaidTrips.message}
      </p>
      <div className="space-y-3">
        {trips.map((trip) => (
          <div
            className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            key={trip.id}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900">
                {trip.type} · {trip.level}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {copy.common.id}: {trip.id}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {trip.city}, {trip.country}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  {new Date(trip.startDate).toLocaleDateString()}
                </span>
                {trip.payment?.status && (
                  <span className="text-xs font-medium text-amber-800">
                    {copy.unpaidTrips.paymentPrefix}: {trip.payment.status}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <span className="font-semibold text-neutral-900">
                ${(trip.totalTripUsd ?? 0).toFixed(0)}
              </span>
              <Button asChild size="sm">
                <Link href={`/${locale}/checkout?tripId=${trip.id}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {copy.unpaidTrips.action}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
