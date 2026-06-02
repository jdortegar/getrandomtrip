"use client";

import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

export function XsedNotesStep({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-adminNotes"
        >
          Admin notes
        </label>
        <textarea
          id="xsed-adminNotes"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Internal notes visible to admins only"
          value={form.adminNotes}
          onChange={(e) => onChange({ adminNotes: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-supplierNotes"
        >
          Supplier notes
        </label>
        <textarea
          id="xsed-supplierNotes"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Notes for the supplier / local operator"
          value={form.supplierNotes}
          onChange={(e) => onChange({ supplierNotes: e.target.value })}
        />
      </div>
    </div>
  );
}
