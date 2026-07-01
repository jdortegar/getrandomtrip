"use client";

import { useId } from "react";
import { FormField } from "@/components/ui/FormField";

interface AccountSettingsPasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}

/**
 * Labeled password input with a show/hide toggle.
 * Thin wrapper over `FormField` — it already renders the eye/eye-off
 * toggle for `type="password"`, so we reuse it instead of duplicating
 * that logic here.
 */
export function AccountSettingsPasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: AccountSettingsPasswordFieldProps) {
  const id = useId();

  return (
    <FormField
      autoComplete={autoComplete}
      id={id}
      label={label}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type="password"
      value={value}
    />
  );
}
