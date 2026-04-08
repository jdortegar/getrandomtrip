import { formatAdminDate, formatAdminAmount } from '@/lib/admin/format';
import type { AdminTripRequest } from '@/lib/admin/types';
import type { MarketingDictionary } from '@/lib/types/dictionary';

type DetailLabels = MarketingDictionary['adminTripEditModal']['details'];

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-base text-gray-600">{label}</span>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  );
}

interface TripRequestDetailsProps {
  labels: DetailLabels;
  trip: AdminTripRequest;
}

export function TripRequestDetails({ labels, trip }: TripRequestDetailsProps) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      <DetailRow
        label={labels.origin}
        value={`${trip.originCity}, ${trip.originCountry}`}
      />
      <DetailRow
        label={labels.dates}
        value={`${formatAdminDate(trip.startDate)} — ${formatAdminDate(trip.endDate)}`}
      />
      <DetailRow
        label={labels.nightsPax}
        value={`${trip.nights}n · ${trip.pax} pax`}
      />
      <DetailRow label={labels.transport} value={trip.transport} />
      {trip.payment ? (
        <DetailRow
          label={labels.payment}
          value={formatAdminAmount(trip.payment.amount, trip.payment.currency)}
        />
      ) : null}
    </div>
  );
}
