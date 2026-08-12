import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { TripRequestsTableRow } from "./TripRequestsTableRow";

type TripRequestsCopy = MarketingDictionary["adminPages"]["tripRequests"];

interface TripRequestsTableProps {
  copy: TripRequestsCopy;
  locale: string;
  paymentStatusLabels: Record<string, string>;
  trips: AdminTripRequest[];
  tripStatusLabels: Record<string, string>;
}

export function TripRequestsTable({
  copy,
  locale,
  paymentStatusLabels,
  trips,
  tripStatusLabels,
}: TripRequestsTableProps) {
  const cols = copy.columns;
  const headers = [
    cols.traveler,
    cols.origin,
    cols.typeLevel,
    cols.status,
    cols.payment,
    cols.actions,
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {trips.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          {copy.empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {headers.map((h) => (
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    key={h}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {trips.map((trip) => (
                <TripRequestsTableRow
                  editHref={`/${locale}/dashboard/admin/trip-requests/${trip.id}`}
                  editTitle={copy.edit}
                  key={trip.id}
                  paymentStatusLabels={paymentStatusLabels}
                  trip={trip}
                  tripStatusLabels={tripStatusLabels}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
