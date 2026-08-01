"use client";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  id?: string;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, disabled, id, onCheckedChange }: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-light-blue" : "bg-gray-200",
        disabled && "cursor-not-allowed opacity-50",
      )}
      disabled={disabled}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
