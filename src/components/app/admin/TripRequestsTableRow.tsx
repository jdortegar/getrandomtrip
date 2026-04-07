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
      <td className="px-4 py-2.5">
        <p className="text-sm font-bold text-gray-900">{trip.user.name}</p>
        <p className="text-xs text-gray-400">{trip.user.email}</p>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-600">
        {trip.originCity}, {trip.originCountry}
      </td>
      <td className="px-4 py-2.5">
        <p className="text-sm text-gray-700">{trip.type}</p>
        <p className="text-xs text-gray-400">{trip.level}</p>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={trip.status} variant="trip" />
      </td>
      <td className="px-4 py-2.5">
        {trip.payment ? (
          <StatusBadge status={trip.payment.status} variant="payment" />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        <button
          className="text-xs font-semibold text-gray-600 hover:text-gray-900"
          onClick={() => onEdit(trip.id)}
          type="button"
        >
          {isSelected ? 'editing' : 'Edit'}
        </button>
      </td>
    </tr>
  );
}
