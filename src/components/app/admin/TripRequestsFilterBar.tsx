import { Check } from "lucide-react";
import Chip from "@/components/Chip";
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
      {FILTER_VALUES.map((value) => {
        const active = activeFilter === value;
        return (
          <Chip
            active={active}
            key={value}
            onClick={() => onFilterChange(value)}
            size="md"
            variant="default"
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {value === "ALL"
              ? labels.all
              : labels[value as Exclude<StatusFilterValue, "ALL">]}
          </Chip>
        );
      })}
    </div>
  );
}
