"use client";

import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

export function XsedBenefitsStep({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-whatsapp"
        >
          WhatsApp template
        </label>
        <textarea
          id="xsed-whatsapp"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[100px] resize-none"
          placeholder="Hola {{name}}, tu destino es {{destination}} el {{date}}..."
          value={form.whatsappMessageTemplate}
          onChange={(e) => onChange({ whatsappMessageTemplate: e.target.value })}
        />
        <p className="text-xs text-neutral-400">
          Use {"{{name}}"}, {"{{destination}}"}, {"{{date}}"}
        </p>
      </div>
    </div>
  );
}
