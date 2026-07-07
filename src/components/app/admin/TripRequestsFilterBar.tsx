import { cn } from "@/lib/utils";
import type { StatusFilterValue } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

type TripStatusLabels = MarketingDictionary["adminTripEditModal"]["tripStatus"];

const FILTER_VALUES: StatusFilterValue[] = [
  "ALL",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
  "CANCELLED",
];

interface TripRequestsFilterBarProps {
  activeFilter: StatusFilterValue;
  labels: { all: string } & TripStatusLabels;
  onFilterChange: (value: StatusFilterValue) => void;
}

export function TripRequestsFilterBar({
  activeFilter,
  labels,
  onFilterChange,
}: TripRequestsFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTER_VALUES.map((value) => (
        <button
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activeFilter === value
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300",
          )}
          key={value}
          onClick={() => onFilterChange(value)}
          type="button"
        >
          {value === "ALL"
            ? labels.all
            : labels[value as Exclude<StatusFilterValue, "ALL">]}
        </button>
      ))}
    </div>
  );
}
