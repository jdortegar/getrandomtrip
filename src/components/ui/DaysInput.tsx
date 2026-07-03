"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface DaysInputProps {
  id: string;
  /** Optional template with {nights} and {days} placeholders — comes from the dictionary. */
  hintTemplate?: string;
  label: ReactNode;
  /** Days value (= nights + 1 when used for nights, or plain day count). */
  value: number;
  onChange: (days: number) => void;
  className?: string;
  inputClassName?: string;
}

export function DaysInput({ id, hintTemplate, label, value, onChange, className, inputClassName }: DaysInputProps) {
  const [raw, setRaw] = useState(String(value ?? 0));

  const days = Math.max(1, parseInt(raw, 10) || 1);
  const hint = hintTemplate
    ? hintTemplate.replace("{nights}", String(days - 1)).replace("{days}", String(days))
    : null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    setRaw(digits);
    const n = parseInt(digits, 10);
    if (!isNaN(n) && n >= 1) onChange(n);
  }

  function handleBlur() {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) || n < 1 ? 1 : n;
    setRaw(String(clamped));
    onChange(clamped);
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? "w-fit"}`}>
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <input
        className={`w-full bg-gray-100 outline-none px-6 py-4 rounded-xl text-gray-900 text-base tabular-nums${inputClassName ? ` ${inputClassName}` : ""}`}
        id={id}
        inputMode="numeric"
        maxLength={2}
        onBlur={handleBlur}
        onChange={handleChange}
        type="text"
        value={raw}
      />
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
