import { cn } from '@/lib/utils';
import type { AdminTripRequest } from '@/lib/admin/types';
import { StatusBadge } from './StatusBadge';

interface TripRequestsTableRowProps {
  isSelected: boolean;
  onEdit: (id: string) => void;
  trip: AdminTripRequest;
}

export function TripRequestsTableRow({
  isSelected,
  onEdit,
  trip,
}: TripRequestsTableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-100 last:border-0',
        isSelected && 'border-l-2 border-l-gray-900 bg-blue-50',
      )}
    >
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-neutral-900">{trip.user.name}</p>
        <p className="text-xs text-neutral-500">{trip.user.email}</p>
      </td>
      <td className="px-4 py-3.5 text-sm text-neutral-600">
        {trip.originCity}, {trip.originCountry}
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-neutral-700">{trip.type}</p>
        <p className="text-xs text-neutral-500">{trip.level}</p>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={trip.status} variant="trip" />
      </td>
      <td className="px-4 py-3.5">
        {trip.payment ? (
          <StatusBadge status={trip.payment.status} variant="payment" />
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right">
        <button
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          onClick={() => onEdit(trip.id)}
          type="button"
        >
          {isSelected ? 'editing' : 'Edit'}
        </button>
      </td>
    </tr>
  );
}
