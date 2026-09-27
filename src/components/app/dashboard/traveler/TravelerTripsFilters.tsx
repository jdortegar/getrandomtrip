"use client";

import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { TRIP_REQUEST_TYPES } from "@/lib/admin/tripRequestsFilters";
import { getBlogLevelOptions } from "@/lib/constants/blog-filters";
import { getTravelerTypeOptions } from "@/lib/data/traveler-types";
import type { StatusFilter } from "./TravelerTripsTable";
import type { TravelerDashboardDict } from "@/lib/types/dictionary";

interface TravelerTripsFiltersProps {
  copy: TravelerDashboardDict["trips"];
  experience: string;
  filter: StatusFilter;
  hasError: boolean;
  isLoading: boolean;
  locale: string;
  onClear?: () => void;
  onExperienceChange?: (value: string) => void;
  onFilterChange: (value: StatusFilter) => void;
  onSearchChange?: (value: string) => void;
  onTravelTypeChange?: (value: string) => void;
  search: string;
  shown: number;
  total: number;
  travelType: string;
}

export function TravelerTripsFilters({
  copy,
  experience,
  filter,
  hasError,
  isLoading,
  locale,
  onClear,
  onExperienceChange,
  onFilterChange,
  onSearchChange,
  onTravelTypeChange,
  search,
  shown,
  total,
  travelType,
}: TravelerTripsFiltersProps) {
  const travelerTypes = getTravelerTypeOptions(locale);

  const hasActiveFilters =
    filter !== "all" ||
    experience !== "all" ||
    travelType !== "all" ||
    !!search.trim();

  return (
    <div data-component="TravelerTripsFilters">
      <TableFilterToolbar
        copy={{ ...copy, count: copy.tripsCount }}
        filters={[
          {
            id: "traveler-trip-status",
            label: copy.filterLabel,
            onChange: (value) => onFilterChange(value as StatusFilter),
            options: [
              { label: copy.filterAll, value: "all" },
              { label: copy.filterUpcoming, value: "upcoming" },
              { label: copy.filterCompleted, value: "completed" },
            ],
            value: filter,
          },
          {
            id: "traveler-trip-experience",
            label: copy.experienceLabel,
            onChange: (value) => onExperienceChange?.(value),
            options: [
              { label: copy.filterAll, value: "all" },
              ...getBlogLevelOptions().map((option) => ({
                label: option.label,
                value: option.key,
              })),
            ],
            value: experience,
          },
          {
            id: "traveler-trip-type",
            label: copy.travelTypeLabel,
            onChange: (value) => onTravelTypeChange?.(value),
            options: [
              { label: copy.filterAll, value: "all" },
              ...TRIP_REQUEST_TYPES.map((value) => ({
                label:
                  value === "xsed"
                    ? copy.xsedType
                    : (travelerTypes.find((option) => option.key === value)
                        ?.title ?? value),
                value,
              })),
            ],
            value: travelType,
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        hasError={hasError}
        isLoading={isLoading}
        onClear={() => onClear?.()}
        search={{
          id: "traveler-trip-search",
          label: copy.searchLabel,
          placeholder: copy.searchPlaceholder,
          onChange: (value) => onSearchChange?.(value),
          value: search,
        }}
        shown={shown}
        total={total}
      />
    </div>
  );
}
