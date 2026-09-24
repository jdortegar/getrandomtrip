import type { ReactNode } from "react";
export function DocumentFieldGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <fieldset
      className="grid min-w-0 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-2"
      data-document-field-group
    >
      <legend className="px-2 text-sm font-semibold text-primary">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
