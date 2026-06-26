"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DurationUnit, DurationValue } from "@/types/tripper";

export interface DurationUnitOption {
  value: DurationUnit;
  label: string;
  hint: string;
}

interface DurationInputProps {
  id: string;
  label: ReactNode;
  value: DurationValue | null;
  onChange: (v: DurationValue) => void;
  units: DurationUnitOption[];
  className?: string;
}

export function DurationInput({
  className,
  id,
  label,
  onChange,
  units,
  value,
}: DurationInputProps) {
  const [raw, setRaw] = React.useState(value ? String(value.value) : "");
  const [unit, setUnit] = React.useState<DurationUnit>(value?.unit ?? "hr");

  const parsed = parseFloat(raw);
  const isValid = !isNaN(parsed) && parsed > 0;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^0-9.]/g, "");
    const dotIndex = v.indexOf(".");
    if (dotIndex !== -1) {
      v = v.slice(0, dotIndex + 2);
    }
    setRaw(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) onChange({ value: n, unit });
  }

  function handleBlur() {
    const n = parseFloat(raw);
    const clamped = isNaN(n) || n <= 0 ? 1 : n;
    setRaw(String(clamped));
    onChange({ value: clamped, unit });
  }

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const u = e.target.value as DurationUnit;
    setUnit(u);
    const n = parseFloat(raw);
    if (!isNaN(n) && n > 0) onChange({ value: n, unit: u });
  }

  const selectedUnit = units.find((u) => u.value === unit);
  const hint = isValid && selectedUnit ? `${parsed} ${selectedUnit.hint}` : null;

  return (
    <div className={cn("flex w-fit flex-col gap-2", className)}>
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
        <input
          id={id}
          inputMode="decimal"
          onBlur={handleBlur}
          onChange={handleValueChange}
          type="text"
          value={raw}
          className="min-w-0 flex-1 bg-transparent outline-none pl-6 pr-2 py-4 text-gray-900 text-base tabular-nums"
        />
        <div className="w-px h-6 bg-gray-300 shrink-0" />
        <select
          value={unit}
          onChange={handleUnitChange}
          className="bg-transparent outline-none pl-3 pr-6 py-4 text-gray-900 text-base appearance-none cursor-pointer"
        >
          {units.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
