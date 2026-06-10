"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface DaysInputProps {
  id: string;
  /** Template with {nights} and {days} placeholders — comes from the dictionary. */
  hintTemplate: string;
  label: ReactNode;
  /** Days value (= nights + 1). */
  value: number;
  onChange: (days: number) => void;
}

export function DaysInput({ id, hintTemplate, label, value, onChange }: DaysInputProps) {
  const [raw, setRaw] = useState(String(value));

  const days = Math.max(1, parseInt(raw, 10) || 1);
  const hint = hintTemplate
    .replace("{nights}", String(days - 1))
    .replace("{days}", String(days));

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
    <div className="flex w-fit flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full bg-gray-100 outline-none px-6 py-4 rounded-xl text-gray-900 text-base tabular-nums"
        id={id}
        inputMode="numeric"
        maxLength={3}
        onBlur={handleBlur}
        onChange={handleChange}
        type="text"
        value={raw}
      />
      <p className="text-xs text-neutral-400">{hint}</p>
    </div>
  );
}
