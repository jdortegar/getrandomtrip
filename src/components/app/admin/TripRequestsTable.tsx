import type { AdminTripRequest } from '@/lib/admin/types';
import { TripRequestsTableRow } from './TripRequestsTableRow';

const HEADERS = ['Traveler', 'Origin', 'Type / Level', 'Status', 'Payment', ''];

interface TripRequestsTableProps {
  onEdit: (id: string) => void;
  selectedId: string | null;
  trips: AdminTripRequest[];
}

export function TripRequestsTable({
  onEdit,
  selectedId,
  trips,
}: TripRequestsTableProps) {
  return (
    <div className="mx-5 my-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-400 last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <TripRequestsTableRow
              key={trip.id}
              isSelected={selectedId === trip.id}
              onEdit={onEdit}
              trip={trip}
            />
          ))}
        </tbody>
      </table>
      {trips.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-400">No trips found.</p>
      )}
    </div>
  );
}
