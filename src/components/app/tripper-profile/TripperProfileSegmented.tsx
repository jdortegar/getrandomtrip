"use client";

import { cn } from "@/lib/utils";

/** Pill-style segmented toggle (filters and map/list) used by the public atlas. */
export function TripperProfileSegmented<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: { count?: number; label: string; value: T }[];
  value: T;
}) {
  return (
    <div aria-label={label} className="inline-flex rounded-md bg-white p-1 shadow-sm" role="group">
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded px-[15px] text-[13px] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value === option.value ? "bg-primary text-white" : "text-ink hover:text-primary",
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
          {option.count !== undefined ? <span className="text-[10px] tabular-nums opacity-80">{option.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
