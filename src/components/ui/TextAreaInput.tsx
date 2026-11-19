"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useFieldValidation } from "./FormValidationScope";
import { cn } from "@/lib/utils";
import {
  PeekToggleButton,
  resolvePeekDisplay,
  type FieldPeek,
} from "./field-peek";
import { FieldMeta } from "./FieldMeta";
import { formControlClass, formLabelClass } from "./formControlClass";

const DEFAULT_MAX = 280;

export interface TextAreaInputProps extends Omit<
  React.ComponentProps<"textarea">,
  "id" | "maxLength"
> {
  /** Optional helper text below the field (left of the counter). */
  hint?: ReactNode;
  id: string;
  label: ReactNode;
  maxLength?: number;
  /** Opt-in "peek at original" toggle. Undefined by default — zero effect on other call sites. */
  peek?: FieldPeek;
}

export function TextAreaInput({
  className,
  hint,
  id,
  label,
  maxLength = DEFAULT_MAX,
  onChange,
  peek,
  placeholder,
  value,
  ...rest
}: TextAreaInputProps) {
  const validation = useFieldValidation(
    rest.name,
    id,
    rest["aria-describedby"],
  );
  const showPeek = !!peek;
  const { displayValue, isEmpty } = resolvePeekDisplay(peek, value);
  const length = typeof displayValue === "string" ? displayValue.length : 0;

  return (
    <div className="flex flex-col gap-2" data-component="TextAreaInput">
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
          {...(validation.error ? validation.attributes : {})}
        />
        {showPeek ? <PeekToggleButton peek={peek} position="textarea" /> : null}
      </div>
      {validation.error && (
        <p className="text-red-700 text-sm" id={validation.errorId}>
          {validation.error}
        </p>
      )}
      {hint ? (
        <FieldMeta count={{ length, max: maxLength }} hint={hint} />
      ) : (
        <span
          className={cn(
            "self-end text-xs",
            length > maxLength ? "text-red-700" : "text-neutral-400",
          )}
        >
          {length} / {maxLength}
        </span>
      )}
    </div>
  );
}
