"use client";

import { X } from "lucide-react";

const inputClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base";

export interface ChipListInputProps {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  chipColor: string;
}

/**
 * Promoted from the tripper `InclusionsStep`'s private `ChipList`
 * (component-patterns.md, design.md ADR-7) so both the tripper experience
 * form and the XSED admin steps consume the same primitive instead of
 * maintaining two copies. Markup is unchanged from the original —
 * promotion is zero visual delta.
 */
export function ChipListInput({
  id,
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
  chipColor,
}: ChipListInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        onAdd(val);
        e.currentTarget.value = "";
      }
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="block font-semibold text-gray-800 text-base" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
      {values.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {values.map((v, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${chipColor}`}
            >
              <span>{v}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-3 text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
