import { formatAdminDate, formatAdminAmount } from '@/lib/admin/format';
import type { AdminTripRequest } from '@/lib/admin/types';

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-700">{value}</span>
    </div>
  );
}

interface TripRequestDetailsProps {
  trip: AdminTripRequest;
}

export function TripRequestDetails({ trip }: TripRequestDetailsProps) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-100 px-4 py-3">
      <DetailRow
        label="Origin"
        value={`${trip.originCity}, ${trip.originCountry}`}
      />
      <DetailRow
        label="Dates"
        value={`${formatAdminDate(trip.startDate)} — ${formatAdminDate(trip.endDate)}`}
      />
      <DetailRow
        label="Nights / Pax"
        value={`${trip.nights}n · ${trip.pax} pax`}
      />
      <DetailRow label="Transport" value={trip.transport} />
      {trip.payment && (
        <DetailRow
          label="Payment"
          value={formatAdminAmount(trip.payment.amount, trip.payment.currency)}
        />
      )}
    </div>
  );
}
