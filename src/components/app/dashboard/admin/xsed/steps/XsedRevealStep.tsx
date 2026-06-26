"use client";

import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

export function XsedRevealStep({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-preRevealCopy"
        >
          Pre-reveal copy
        </label>
        <textarea
          id="xsed-preRevealCopy"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Copy shown before the destination is revealed"
          value={form.preRevealCopy}
          onChange={(e) => onChange({ preRevealCopy: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-revealCopy"
        >
          Reveal copy
        </label>
        <textarea
          id="xsed-revealCopy"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Copy shown after the destination reveal"
          value={form.revealCopy}
          onChange={(e) => onChange({ revealCopy: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="xsed-packingHints"
        >
          Packing hints
        </label>
        <textarea
          id="xsed-packingHints"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder="Packing tips for the traveler"
          value={form.packingHints}
          onChange={(e) => onChange({ packingHints: e.target.value })}
        />
      </div>
    </div>
  );
}
