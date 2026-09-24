"use client";
import type { ComponentProps } from "react";
import { useFieldValidation } from "@/components/ui/FormValidationScope";
export function DocumentValidationGroup({
  children,
  name,
  ...props
}: ComponentProps<"fieldset"> & { name: string }) {
  const validation = useFieldValidation(name, `${name}-group`);
  return (
    <fieldset {...props} {...validation.attributes} name={name} tabIndex={-1}>
      {children}
      {validation.error && (
        <p className="text-red-700 text-sm" id={validation.errorId}>
          {validation.error}
        </p>
      )}
    </fieldset>
  );
}
