import { cn } from '@/lib/utils';
import { TRIP_STATUS_FLOW } from '@/lib/admin/trip-status';
import { formatAdminDate } from '@/lib/admin/format';
import type { AdminTripRequest, TripRequestStatus } from '@/lib/admin/types';

const TIMELINE_STATUSES: TripRequestStatus[] = ['CONFIRMED', 'REVEALED', 'COMPLETED'];

const STATUS_DATE_FIELD: Partial<Record<TripRequestStatus, keyof AdminTripRequest>> = {
  COMPLETED: 'completedAt',
  CONFIRMED: 'updatedAt',
  REVEALED: 'destinationRevealedAt',
};

interface TripStatusTimelineProps {
  currentStatus: TripRequestStatus;
  statusLabel: (status: TripRequestStatus) => string;
  timelineTitle: string;
  trip: AdminTripRequest;
}

export function TripStatusTimeline({
  currentStatus,
  statusLabel,
  timelineTitle,
  trip,
}: TripStatusTimelineProps) {
  const currentIndex = TRIP_STATUS_FLOW.indexOf(currentStatus);
  return (
    <div>
      <p className="mb-2 text-base font-bold uppercase tracking-wide text-gray-800">
        {timelineTitle}
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
                  isPast ? 'bg-green-500' : 'bg-gray-300',
                )}
              />
              <span
                className={cn(
                  'text-base font-semibold',
                  isPast ? 'text-gray-900' : 'text-gray-600',
                )}
              >
                {statusLabel(status)}
              </span>
              {isPast && dateValue ? (
                <span className="ml-auto text-base text-gray-600">
                  {formatAdminDate(dateValue)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
