"use client";

import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

export function XsedPoliciesStep({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-cancellationPolicy"
        >
          Cancellation policy
        </label>
        <textarea
          id="xsed-cancellationPolicy"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Cancellation terms and conditions"
          value={form.cancellationPolicy}
          onChange={(e) => onChange({ cancellationPolicy: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-weatherPolicy"
        >
          Weather policy
        </label>
        <textarea
          id="xsed-weatherPolicy"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Weather contingency policy"
          value={form.weatherPolicy}
          onChange={(e) => onChange({ weatherPolicy: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-accessibilityNotes"
        >
          Accessibility notes
        </label>
        <textarea
          id="xsed-accessibilityNotes"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Accessibility considerations for travelers"
          value={form.accessibilityNotes}
          onChange={(e) => onChange({ accessibilityNotes: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-safetyNotes"
        >
          Safety notes
        </label>
        <textarea
          id="xsed-safetyNotes"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Safety information for travelers"
          value={form.safetyNotes}
          onChange={(e) => onChange({ safetyNotes: e.target.value })}
        />
      </div>
    </div>
  );
}
