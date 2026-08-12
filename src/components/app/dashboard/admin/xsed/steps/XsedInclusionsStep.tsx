"use client";

import { ChipListInput } from "@/components/ui/ChipListInput";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: Pick<
    AdminXsedDict["form"]["fields"],
    "inclusions" | "addInclusion" | "exclusions" | "addExclusion"
  >;
}

/**
 * Parallel thin XSED-specific step reusing the shared `ChipListInput`
 * primitive (design.md ADR-7) — not adapted from the tripper
 * `InclusionsStep`, which reads copy through positional dict indexes with
 * no XSED equivalent.
 */
export function XsedInclusionsStep({ form, onChange, copy }: Props) {
  return (
    <div className="space-y-6">
      <ChipListInput
        id="xsed-inc-inclusions"
        label={copy.inclusions}
        placeholder={copy.addInclusion}
        values={form.inclusions}
        onAdd={(v) => onChange({ inclusions: [...form.inclusions, v] })}
        onRemove={(i) =>
          onChange({ inclusions: form.inclusions.filter((_, idx) => idx !== i) })
        }
        chipColor="bg-green-50 text-green-800 border border-green-100"
      />

      <ChipListInput
        id="xsed-inc-exclusions"
        label={copy.exclusions}
        placeholder={copy.addExclusion}
        values={form.exclusions}
        onAdd={(v) => onChange({ exclusions: [...form.exclusions, v] })}
        onRemove={(i) =>
          onChange({ exclusions: form.exclusions.filter((_, idx) => idx !== i) })
        }
        chipColor="bg-red-50 text-red-800 border border-red-100"
      />
    </div>
  );
}
