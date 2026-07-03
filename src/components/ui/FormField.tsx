"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { PeekToggleButton, resolvePeekDisplay, type FieldPeek } from "./field-peek";

const formControlClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base";

const formLabelClass = "block font-normal text-gray-600 text-base";

export interface FormFieldProps extends Omit<
  React.ComponentProps<"input">,
  "id"
> {
  id: string;
  label: ReactNode;
  /** Opt-in "peek at original" toggle. Undefined by default — zero effect on other call sites. */
  peek?: FieldPeek;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField(
    { className, id, label, peek, placeholder, type, value, ...inputProps },
    ref,
  ) {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const isPasswordField = type === "password";
    const resolvedType = isPasswordField
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

    const showPeek = !!peek && !isPasswordField;
    const { displayValue, isEmpty } = resolvePeekDisplay(peek, value);

    return (
      <div className="flex flex-col gap-2">
        <label className={formLabelClass} htmlFor={id}>
          {label}
        </label>
        <div className="relative">
          <input
            className={cn(
              formControlClass,
              (isPasswordField || showPeek) && "pr-12",
              peek?.active && !isEmpty && "line-through",
              isEmpty && "italic",
              className,
            )}
            id={id}
            placeholder={isEmpty ? peek?.emptyLabel : placeholder}
            ref={ref}
            type={resolvedType}
            value={displayValue}
            {...inputProps}
          />
          {isPasswordField ? (
            <button
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              type="button"
            >
              {isPasswordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          ) : null}
          {showPeek ? <PeekToggleButton peek={peek} position="input" /> : null}
        </div>
      </div>
    );
  },
);

FormField.displayName = "FormField";

export interface FormSelectFieldProps extends Omit<
  React.ComponentProps<"select">,
  "id"
> {
  children: ReactNode;
  id: string;
  label: ReactNode;
}

export const FormSelectField = React.forwardRef<
  HTMLSelectElement,
  FormSelectFieldProps
>(function FormSelectField(
  { children, className, id, label, ...selectProps },
  ref,
) {
  return (
    <div className="flex flex-col gap-2">
      <label className={formLabelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          className={cn(
            formControlClass,
            "appearance-none cursor-pointer pr-12",
            className,
          )}
          id={id}
          ref={ref}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="absolute -translate-y-1/2 h-5 pointer-events-none right-4 top-1/2 w-5 text-gray-500"
        />
      </div>
    </div>
  );
});

FormSelectField.displayName = "FormSelectField";
