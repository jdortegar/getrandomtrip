import type { TripRequestStatus } from "@/lib/admin/trip-status";
import type { MarketingDictionary } from "@/lib/types/dictionary";

type TripStatusLabels = MarketingDictionary["adminTripEditModal"]["tripStatus"];

interface TripRequestsKPIStripProps {
  counts: Record<TripRequestStatus, number>;
  labels: TripStatusLabels;
}

export function TripRequestsKPIStrip({ counts, labels }: TripRequestsKPIStripProps) {
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
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
            {m.label}
          </span>
          <span className="font-barlow-condensed text-3xl font-extrabold text-ink">
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
