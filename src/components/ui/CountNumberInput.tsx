"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface CountNumberInputProps {
  id: string;
  label: ReactNode;
  /** Current headcount value. */
  value: number;
  onChange: (value: number) => void;
  /** Minimum allowed value — e.g. 1 for Adults, 0 for Minors/Pets. */
  min: number;
  className?: string;
  inputClassName?: string;
}

/**
 * Plain labeled numeric input matching this app's existing numeric-input
 * style (see DaysInput). Used for headcount fields (Adults/Minors/Pets) in
 * the journey "Travellers" substep — unlike DaysInput, `min` is configurable
 * rather than hardcoded to 1, since Minors/Pets can be 0.
 */
export function CountNumberInput({
  id,
  label,
  value,
  onChange,
  min,
  className,
  inputClassName,
}: CountNumberInputProps) {
  const [raw, setRaw] = useState(String(value ?? min));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    setRaw(digits);
    const n = parseInt(digits, 10);
    if (!isNaN(n) && n >= min) onChange(n);
  }

  function handleBlur() {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) || n < min ? min : n;
    setRaw(String(clamped));
    onChange(clamped);
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? "w-fit"}`}>
      <label
        className="block font-normal text-gray-600 text-base"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className={`w-full bg-gray-100 outline-none px-6 py-4 rounded-xl text-ink text-base tabular-nums${inputClassName ? ` ${inputClassName}` : ""}`}
        id={id}
        inputMode="numeric"
        maxLength={2}
        onBlur={handleBlur}
        onChange={handleChange}
        type="text"
        value={raw}
      />
    </div>
  );
}
