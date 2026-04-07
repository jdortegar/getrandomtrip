import { cn } from '@/lib/utils';
import { TRIP_STATUS_FLOW } from '@/lib/admin/trip-status';
import { formatAdminDate } from '@/lib/admin/format';
import type { AdminTripRequest, TripRequestStatus } from '@/lib/admin/types';

const TIMELINE_STATUSES: TripRequestStatus[] = ['CONFIRMED', 'REVEALED', 'COMPLETED'];

const STATUS_DATE_FIELD: Partial<Record<TripRequestStatus, keyof AdminTripRequest>> = {
  COMPLETED: 'completedAt',
  CONFIRMED: 'updatedAt',
  REVEALED:  'destinationRevealedAt',
};

interface TripStatusTimelineProps {
  currentStatus: TripRequestStatus;
  trip: AdminTripRequest;
}

export function TripStatusTimeline({ currentStatus, trip }: TripStatusTimelineProps) {
  const currentIndex = TRIP_STATUS_FLOW.indexOf(currentStatus);
  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
        Status Timeline
      </p>
      <div className="flex flex-col gap-2">
        {TIMELINE_STATUSES.map((status) => {
          const statusIndex = TRIP_STATUS_FLOW.indexOf(status);
          const isPast = statusIndex <= currentIndex;
          const dateField = STATUS_DATE_FIELD[status];
          const dateValue = dateField ? (trip[dateField] as string | null) : null;
          return (
            <div key={status} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  isPast ? 'bg-green-500' : 'bg-gray-200',
                )}
              />
              <span
                className={cn(
                  'text-xs font-semibold',
                  isPast ? 'text-gray-700' : 'text-gray-400',
                )}
              >
                {status}
              </span>
              {isPast && dateValue && (
                <span className="ml-auto text-xs text-gray-400">
                  {formatAdminDate(dateValue)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
