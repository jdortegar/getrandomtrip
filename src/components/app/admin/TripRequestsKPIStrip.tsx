import { countTripsByStatus } from '@/lib/admin/trip-status';
import type { AdminTripRequest } from '@/lib/admin/types';
import { AdminKPICard } from './AdminKPICard';

interface TripRequestsKPIStripProps {
  trips: AdminTripRequest[];
}

export function TripRequestsKPIStrip({ trips }: TripRequestsKPIStripProps) {
  const counts = countTripsByStatus(trips);
  return (
    <div className="grid grid-cols-4 gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
      <AdminKPICard label="Confirmed"  count={counts.CONFIRMED}       />
      <AdminKPICard label="Pending"    count={counts.PENDING_PAYMENT} />
      <AdminKPICard label="Revealed"   count={counts.REVEALED}        />
      <AdminKPICard label="Completed"  count={counts.COMPLETED}       />
    </div>
  );
}
