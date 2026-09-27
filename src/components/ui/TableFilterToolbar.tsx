"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { TableFilterToolbarProps } from "@/lib/types/TableFilterToolbar";
import { cn } from "@/lib/utils";

const CONTROL_CLASS =
  "bg-white border-gray-200 h-11 min-w-0 px-3 py-2 rounded-lg shadow-sm";

export function TableFilterToolbar({
  actions,
  copy,
  filters,
  hasActiveFilters,
  hasError = false,
  isLoading = false,
  onClear,
  search,
  shown,
  total,
}: TableFilterToolbarProps) {
  return (
    <div
      className="space-y-3 [&_label]:font-medium [&_label]:text-sm"
      data-component="TableFilterToolbar"
    >
      <div
        className={cn(
          "gap-4 grid",
          search &&
            filters.length > 0 &&
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-end",
        )}
      >
        {search && (
          <FormField
            aria-label={search.label}
            className={CONTROL_CLASS}
            id={search.id}
            label={search.label}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder}
            type="search"
            value={search.value}
          />
        )}
        {filters.length > 0 && (
          <div
            className={cn(
              "gap-3 grid grid-cols-2 min-w-0 [&_svg]:right-2",
              "md:grid-cols-4 md:[&_svg]:right-4",
            )}
            data-component="TableFilterControls"
          >
            {filters.map((filter) => (
              <FormSelectField
                aria-label={filter.label}
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
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelectField>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-between min-h-11">
        <p
          aria-atomic="true"
          aria-busy={isLoading}
          className="flex gap-2 items-center text-[13px] text-neutral-600"
          role="status"
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin h-4 w-4" />
              {copy.loading}
            </>
          ) : !hasError ? (
            <>
              {shown} {copy.of} {total} {copy.count}
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          {hasActiveFilters && (
            <Button
              className="font-medium gap-1.5 h-11 normal-case px-2 text-[13px] text-primary tracking-normal"
              onClick={onClear}
              type="button"
              variant="ghost"
            >
              <X aria-hidden className="h-4 w-4" />
              {copy.clearFilters}
            </Button>
          )}
          {actions && (
            <div
              className="flex flex-wrap gap-3 items-center"
              inert={isLoading || hasError || undefined}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
