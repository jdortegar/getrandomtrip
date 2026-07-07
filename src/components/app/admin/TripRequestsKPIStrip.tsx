import { countTripsByStatus } from "@/lib/admin/trip-status";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

type TripStatusLabels = MarketingDictionary["adminTripEditModal"]["tripStatus"];

interface TripRequestsKPIStripProps {
  labels: TripStatusLabels;
  trips: AdminTripRequest[];
}

export function TripRequestsKPIStrip({ labels, trips }: TripRequestsKPIStripProps) {
  const counts = countTripsByStatus(trips);
  const metrics = [
    { key: "CONFIRMED", label: labels.CONFIRMED, value: counts.CONFIRMED },
    {
      key: "PENDING_PAYMENT",
      label: labels.PENDING_PAYMENT,
      value: counts.PENDING_PAYMENT,
    },
    { key: "REVEALED", label: labels.REVEALED, value: counts.REVEALED },
    { key: "COMPLETED", label: labels.COMPLETED, value: counts.COMPLETED },
  ];
  return (
    <div className="flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      {metrics.map((m) => (
        <div
          className="flex flex-1 items-center justify-between border-l border-gray-200 px-6 py-4 first:border-l-0"
          key={m.key}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            {m.label}
          </span>
          <span className="font-barlow-condensed text-3xl font-extrabold text-gray-900">
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
