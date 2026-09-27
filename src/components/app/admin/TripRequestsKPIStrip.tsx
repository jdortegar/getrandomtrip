import type { TripRequestStatus } from "@/lib/admin/trip-status";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

type TripStatusLabels = MarketingDictionary["adminTripEditModal"]["tripStatus"];

interface TripRequestsKPIStripProps {
  counts: Record<TripRequestStatus, number>;
  labels: TripStatusLabels;
}

export function TripRequestsKPIStrip({
  counts,
  labels,
}: TripRequestsKPIStripProps) {
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
    <dl
      className={cn(
        "auto-rows-fr bg-gray-200 gap-px grid grid-cols-2 overflow-hidden ring-1 ring-gray-200 rounded-2xl shadow-sm",
        "md:grid-cols-4",
      )}
      data-component="TripRequestsKPIStrip"
    >
      {metrics.map((m) => (
        <div
          className="bg-white flex flex-col gap-2 justify-between min-w-0 p-4"
          key={m.key}
        >
          <dt className="break-words font-medium leading-5 text-neutral-600 text-sm">
            {m.label}
          </dt>
          <dd className="font-barlow-condensed font-extrabold leading-none tabular-nums text-3xl text-ink">
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
