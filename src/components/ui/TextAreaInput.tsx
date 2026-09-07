"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  PeekToggleButton,
  resolvePeekDisplay,
  type FieldPeek,
} from "./field-peek";
import { formControlClass, formLabelClass } from "./formControlClass";

const DEFAULT_MAX = 280;

export interface TextAreaInputProps extends Omit<
  React.ComponentProps<"textarea">,
  "id" | "maxLength"
> {
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
      <label className={formLabelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <textarea
          className={cn(
            formControlClass,
            "min-h-[160px] resize-none",
            showPeek && "pr-12",
            peek?.active && !isEmpty && "line-through",
            isEmpty && "italic",
            className,
          )}
          id={id}
          maxLength={maxLength}
          onChange={onChange}
          placeholder={isEmpty ? peek?.emptyLabel : placeholder}
          value={displayValue}
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
