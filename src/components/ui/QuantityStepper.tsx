"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

const stepperBtnClass = cn(
  "flex h-full w-10 items-center justify-center font-semibold text-gray-700",
  "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40",
);

const stepperLabelClass = "font-barlow font-medium text-gray-900 text-sm";

const stepperShellClass = cn(
  "flex h-10 items-center rounded-lg border border-gray-200 bg-white",
);

const stepperValueClass =
  "min-w-10 text-center font-barlow font-bold text-gray-900 text-sm";

export interface QuantityStepperProps {
  ariaDecrease: string;
  ariaIncrease: string;
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  value: number;
}

/** Shared labeled +/- counter row. Used by checkout's travelers modal and by the journey/details "Travellers" substep. */
export function QuantityStepper({
  ariaDecrease,
  ariaIncrease,
  label,
  max,
  min,
  onValueChange,
  value,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className={stepperLabelClass}>{label}</span>
      <div className={stepperShellClass}>
        <button
          aria-label={ariaDecrease}
          className={stepperBtnClass}
          disabled={value <= min}
          onClick={() => onValueChange(Math.max(min, value - 1))}
          type="button"
        >
          <Minus aria-hidden className="h-4 w-4" />
        </button>
        <span className={stepperValueClass}>{value}</span>
        <button
          aria-label={ariaIncrease}
          className={stepperBtnClass}
          disabled={value >= max}
          onClick={() => onValueChange(Math.min(max, value + 1))}
          type="button"
        >
          <Plus aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
