import { cn } from "@/lib/utils";
import type { StatusFilterValue } from "@/lib/admin/types";

const FILTERS: { label: string; value: StatusFilterValue }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING_PAYMENT" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Revealed", value: "REVEALED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

interface TripRequestsFilterBarProps {
  activeFilter: StatusFilterValue;
  onFilterChange: (value: StatusFilterValue) => void;
}

export function TripRequestsFilterBar({
  activeFilter,
  onFilterChange,
}: TripRequestsFilterBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
      <p className="font-barlow-condensed text-xl font-extrabold uppercase  text-gray-900">
        Trip Requests
      </p>
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              activeFilter === f.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300",
            )}
            onClick={() => onFilterChange(f.value)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
