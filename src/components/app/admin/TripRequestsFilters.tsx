"use client";

import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import {
  TRIP_PAYMENT_STATUS_VALUES,
  TRIP_REQUEST_LEVELS,
  TRIP_REQUEST_TYPES,
  type TripPaymentStatusFilter,
  type TripRequestLevel,
  type TripRequestType,
} from "@/lib/admin/tripRequestsFilters";
import type { StatusFilterValue } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface TripRequestsFiltersProps {
  copy: MarketingDictionary["adminPages"]["tripRequests"];
  hasActiveFilters: boolean;
  hasError?: boolean;
  isLoading?: boolean;
  level: TripRequestLevel | "ALL";
  onClear: () => void;
  onLevelChange: (value: TripRequestLevel | "ALL") => void;
  onPaymentChange: (value: TripPaymentStatusFilter | "ALL") => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilterValue) => void;
  onTypeChange: (value: TripRequestType | "ALL") => void;
  payment: TripPaymentStatusFilter | "ALL";
  paymentStatusLabels: Record<string, string>;
  search: string;
  shown: number;
  status: StatusFilterValue;
  total: number;
  tripStatusLabels: Record<string, string>;
  type: TripRequestType | "ALL";
}

export function TripRequestsFilters({
  copy,
  hasActiveFilters,
  hasError,
  isLoading,
  level,
  onClear,
  onLevelChange,
  onPaymentChange,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  payment,
  paymentStatusLabels,
  search,
  shown,
  status,
  total,
  tripStatusLabels,
  type,
}: TripRequestsFiltersProps) {
  const filters = [
    {
      id: "trip-request-status",
      label: copy.columns.status,
      onChange: (value: string) => onStatusChange(value as StatusFilterValue),
      options: Object.entries(tripStatusLabels),
      value: status,
    },
    {
      id: "trip-request-type",
      label: copy.filters.typeLabel,
      onChange: (value: string) =>
        onTypeChange(value as TripRequestType | "ALL"),
      options: TRIP_REQUEST_TYPES.map((value) => [
        value,
        copy.filters.types[value],
      ]),
      value: type,
    },
    {
      id: "trip-request-level",
      label: copy.filters.levelLabel,
      onChange: (value: string) =>
        onLevelChange(value as TripRequestLevel | "ALL"),
      options: TRIP_REQUEST_LEVELS.map((value) => [
        value,
        copy.filters.levels[value],
      ]),
      value: level,
    },
    {
      id: "trip-request-payment",
      label: copy.columns.payment,
      onChange: (value: string) =>
        onPaymentChange(value as TripPaymentStatusFilter | "ALL"),
      options: [
        ["NO_PAYMENT", copy.filters.noPayment],
        ...TRIP_PAYMENT_STATUS_VALUES.map((value) => [
          value,
          paymentStatusLabels[value] ?? value,
        ]),
      ],
      value: payment,
    },
  ];

  return (
    <div data-component="TripRequestsFilters">
      <TableFilterToolbar
        copy={copy.filters}
        filters={filters.map((filter) => ({
          ...filter,
          options: [
            { label: copy.filters.all, value: "ALL" },
            ...filter.options.map(([value, label]) => ({ label, value })),
          ],
        }))}
        hasActiveFilters={hasActiveFilters}
        hasError={hasError}
        isLoading={isLoading}
        onClear={onClear}
        search={{
          id: "trip-request-search",
          label: copy.filters.searchLabel,
          placeholder: copy.filters.searchPlaceholder,
          onChange: onSearchChange,
          value: search,
        }}
        shown={shown}
        total={total}
      />
    </div>
  );
}
