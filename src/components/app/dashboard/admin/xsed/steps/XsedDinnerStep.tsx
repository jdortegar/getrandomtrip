"use client";

import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { ActivityEntry, XsedDropDraft, XsedSection } from "@/types/xsed";
import { EMPTY_XSED_SECTION } from "@/types/xsed";
import { XsedActivityEntryFields } from "./XsedActivityEntryFields";
import { XsedSectionFields } from "./XsedSectionFields";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"]["activities"];
  sectionsCopy: AdminXsedDict["form"]["fields"]["sections"];
  imageCopy: Pick<
    AdminXsedDict["form"]["fields"],
    "heroImageSizeHint" | "copyrightHint" | "imageTooSmall"
  >;
}

const EMPTY_ENTRY: ActivityEntry = {
  name: "",
  durationRhythm: null,
  description: "",
  risks: "",
  image: null,
};

// XSED drops include exactly one dinner, stored at index 0 of the shared
// `activities` array (index 1 is the activity — see XsedActivityStep). Its
// narrative title/content/photos live at sections[1] (see types/xsed.ts).
export function XsedDinnerStep({ form, onChange, copy, sectionsCopy, imageCopy }: Props) {
  const dinner = form.activities[0] ?? EMPTY_ENTRY;
  const activity = form.activities[1] ?? EMPTY_ENTRY;

  function handleChange<K extends keyof ActivityEntry>(key: K, value: ActivityEntry[K]) {
    onChange({ activities: [{ ...dinner, [key]: value }, activity] });
  }

  function updateSection(patch: Partial<XsedSection>) {
    const sections = form.sections.slice();
    sections[1] = { ...(sections[1] ?? EMPTY_XSED_SECTION), ...patch };
    onChange({ sections });
  }

  return (
    <div className="space-y-6">
      <XsedActivityEntryFields
        idPrefix="xsed-dinner"
        namePlaceholder={copy.dinnerNamePlaceholder}
        entry={dinner}
        onChange={handleChange}
        copy={copy}
      />

      <div className="border-t border-gray-100 pt-6">
        <XsedSectionFields
          idPrefix="xsed-dinner-section"
          entry={form.sections[1] ?? EMPTY_XSED_SECTION}
          onChange={updateSection}
          copy={sectionsCopy}
          imageCopy={imageCopy}
        />
      </div>
    </div>
  );
}
