"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-ink w-full text-base";

export interface ChipListInputProps {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  kind: "inclusion" | "exclusion";
}

/**
 * Promoted from the tripper `InclusionsStep`'s private `ChipList`
 * (component-patterns.md, design.md ADR-7) so both the tripper experience
 * form and the XSED admin steps consume the same primitive instead of
 * maintaining two copies. Inclusion/exclusion intent selects local tag styles.
 */
export function ChipListInput({
  id,
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
  kind,
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
    <div className="flex flex-col gap-2" data-component="ChipListInput">
      <label
        className="block font-semibold text-gray-800 text-base"
        htmlFor={id}
      >
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
              className={cn(
                "border flex items-center justify-between px-4 py-2.5 rounded-lg text-sm",
                kind === "inclusion"
                  ? "bg-green-50 border-green-100 text-green-800"
                  : "bg-red-50 border-red-100 text-red-800",
              )}
            >
              <span className="uppercase">{v}</span>
              <button
                aria-label={v}
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
