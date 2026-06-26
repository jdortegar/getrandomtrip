"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_MAX = 280;

export interface TextAreaInputProps
  extends Omit<React.ComponentProps<"textarea">, "id" | "maxLength"> {
  id: string;
  label: ReactNode;
  maxLength?: number;
}

export function TextAreaInput({
  className,
  id,
  label,
  maxLength = DEFAULT_MAX,
  onChange,
  value,
  ...rest
}: TextAreaInputProps) {
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        className={cn(
          "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base resize-none min-h-[160px]",
          className,
        )}
        {...rest}
      />
      <span className="text-xs text-neutral-400 self-end">
        {length} / {maxLength}
      </span>
    </div>
  );
}
