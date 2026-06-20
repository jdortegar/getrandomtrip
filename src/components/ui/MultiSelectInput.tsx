"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectInputProps {
  id?: string;
  label?: ReactNode;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  hint?: string;
  triggerClassName?: string;
}

export function MultiSelectInput({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No results.",
  hint,
  triggerClassName,
}: MultiSelectInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  }

  const selected = options.filter((o) => value.includes(o.value));
  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor={id}
        >
          {label}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn("min-h-[56px] w-full bg-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center text-left", triggerClassName)}
          >
            {selected.length === 0 && (
              <span className="text-gray-400 text-base flex-1">
                {placeholder}
              </span>
            )}
            {selected.map((o) => (
              <span
                key={o.value}
                className="flex items-center gap-1 bg-light-blue text-white text-sm px-2.5 py-0.5 rounded-full"
              >
                {o.label}
                <span
                  role="button"
                  aria-label={`Remove ${o.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== o.value));
                  }}
                  className="hover:opacity-75 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <CommandPrimitive shouldFilter={false}>
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Options list */}
            <CommandPrimitive.List className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">
                  {emptyLabel}
                </p>
              )}
              {filtered.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandPrimitive.Item
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer select-none transition-colors",
                      isSelected
                        ? "text-light-blue bg-light-blue/10"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-light-blue bg-light-blue"
                          : "border-gray-300",
                      )}
                    >
                      {isSelected && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    {option.label}
                  </CommandPrimitive.Item>
                );
              })}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>

      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
