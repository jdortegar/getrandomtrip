"use client";

import { cn } from "@/lib/utils";
import type { TripperDashboardDict } from "@/lib/types/dictionary";

export type TripperProfileViewMode = "tripper" | "traveler";

interface TripperViewToggleProps {
  copy: TripperDashboardDict["settingsProfile"]["viewToggle"];
  value: TripperProfileViewMode;
  onChange: (value: TripperProfileViewMode) => void;
}

export function TripperViewToggle({
  copy,
  value,
  onChange,
}: TripperViewToggleProps) {
  const options: { mode: TripperProfileViewMode; label: string }[] = [
    { mode: "traveler", label: copy.traveler },
    { mode: "tripper", label: copy.tripper },
  ];

  return (
    <div
      className="flex w-fit self-start items-center gap-1 rounded-sm border-2 border-gray-900 p-1"
      role="group"
    >
      {options.map(({ mode, label }) => (
        <button
          key={mode}
          aria-pressed={value === mode}
          className={cn(
            "rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[1px] transition-colors sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[1.5px]",
            value === mode
              ? "bg-gray-900 text-white"
              : "text-gray-900 hover:bg-gray-100",
          )}
          onClick={() => onChange(mode)}
          type="button"
        >
          <span className="hidden sm:inline">{copy.prefix}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
