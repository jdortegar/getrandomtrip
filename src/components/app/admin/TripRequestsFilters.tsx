"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
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
import { cn } from "@/lib/utils";

interface TripRequestsFiltersProps {
  copy: MarketingDictionary["adminPages"]["tripRequests"];
  hasActiveFilters: boolean;
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

const CONTROL_CLASS =
  "bg-white border-gray-200 h-11 min-w-0 px-3 py-2 rounded-lg shadow-sm";

export function TripRequestsFilters({
  copy,
  hasActiveFilters,
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
    <div
      className="space-y-3 [&_label]:font-medium [&_label]:text-sm"
      data-component="TripRequestsFilters"
    >
      <div
        className={cn(
          "gap-4 grid",
          "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-end",
        )}
      >
        <FormField
          className={CONTROL_CLASS}
          id="trip-request-search"
          label={copy.filters.searchLabel}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={copy.filters.searchPlaceholder}
          type="search"
          value={search}
        />
        <div
          className={cn(
            "gap-3 grid grid-cols-2 min-w-0 [&_svg]:right-2",
            "md:grid-cols-4 md:[&_svg]:right-4",
          )}
        >
          {filters.map((filter) => (
            <FormSelectField
              className={cn(
                CONTROL_CLASS,
                "pr-8 text-[13px]",
                "md:pr-10 md:text-sm",
              )}
              id={filter.id}
              key={filter.id}
              label={filter.label}
              onChange={(event) => filter.onChange(event.target.value)}
              value={filter.value}
            >
              <option value="ALL">{copy.filters.all}</option>
              {filter.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelectField>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-between min-h-11">
        <p
          aria-atomic="true"
          className="text-[13px] text-neutral-600"
          role="status"
        >
          {shown} {copy.filters.of} {total} {copy.filters.count}
        </p>
        {hasActiveFilters && (
          <Button
            className="font-medium gap-1.5 h-11 normal-case px-2 text-[13px] text-primary tracking-normal"
            onClick={onClear}
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="h-4 w-4" />
            {copy.filters.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}
