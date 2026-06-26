"use client";

import { FormField } from "@/components/ui/FormField";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

export function XsedDatesStep({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="xsed-tripDate"
          label="Trip date"
          type="date"
          value={form.tripDate}
          onChange={(e) => onChange({ tripDate: e.target.value })}
        />
        <FormField
          id="xsed-basePrice"
          label="Base price (USD)"
          type="text"
          inputMode="numeric"
          value={String(form.basePrice)}
          onChange={(e) => onChange({ basePrice: Number(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}
