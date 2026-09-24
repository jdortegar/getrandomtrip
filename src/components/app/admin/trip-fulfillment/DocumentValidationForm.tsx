"use client";
import { useContext, useState, type ReactNode } from "react";
import { DocumentServerValidationContext } from "./DocumentServerValidationContext";
import { FormValidationScope } from "@/components/ui/FormValidationScope";
import type { DocumentParseResult } from "@/lib/types/DocumentValidation";
import type { HotelVoucherFormCopy } from "@/lib/types/dictionary";
interface Props<T> {
  children: ReactNode;
  copy: HotelVoucherFormCopy;
  onSubmit: (value: T) => void;
  parse: (value: T, mode: "generation") => DocumentParseResult<T>;
  submitting: boolean;
  value: T;
}
export function DocumentValidationForm<T>({
  children,
  copy,
  onSubmit,
  parse,
  submitting,
  value,
}: Props<T>) {
  const server = useContext(DocumentServerValidationContext);
  const [attempt, setAttempt] = useState(0);
  const result = attempt ? parse(value, "generation") : undefined;
  const errors = [
    ...(result && !result.ok ? result.errors : []),
    ...server.errors,
  ];
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting) return;
        setAttempt((count) => count + 1);
        const parsed = parse(value, "generation");
        if (parsed.ok) onSubmit(parsed.value);
      }}
    >
      <FormValidationScope
        errors={errors}
        focusRequest={attempt + server.attempt}
        messages={copy.errors}
      >
        {children}
        {errors.length > 0 && <p role="alert">{copy.invalid}</p>}
      </FormValidationScope>
    </form>
  );
}
