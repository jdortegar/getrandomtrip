"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PeekToggleButton, resolvePeekDisplay, type FieldPeek } from "./field-peek";

const DEFAULT_MAX = 280;

export interface TextAreaInputProps
  extends Omit<React.ComponentProps<"textarea">, "id" | "maxLength"> {
  id: string;
  label: ReactNode;
  maxLength?: number;
  /** Opt-in "peek at original" toggle. Undefined by default — zero effect on other call sites. */
  peek?: FieldPeek;
}

export function TextAreaInput({
  className,
  id,
  label,
  maxLength = DEFAULT_MAX,
  onChange,
  peek,
  placeholder,
  value,
  ...rest
}: TextAreaInputProps) {
  const showPeek = !!peek;
  const { displayValue, isEmpty } = resolvePeekDisplay(peek, value);
  const length = typeof displayValue === "string" ? displayValue.length : 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <textarea
          id={id}
          maxLength={maxLength}
          value={displayValue}
          onChange={onChange}
          placeholder={isEmpty ? peek?.emptyLabel : placeholder}
          className={cn(
            "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base resize-none min-h-[160px]",
            showPeek && "pr-12",
            peek?.active && !isEmpty && "line-through",
            isEmpty && "italic",
            className,
          )}
          {...rest}
        />
        {showPeek ? <PeekToggleButton peek={peek} position="textarea" /> : null}
      </div>
      <span className="text-xs text-neutral-400 self-end">
        {length} / {maxLength}
      </span>
    </div>
  );
}
