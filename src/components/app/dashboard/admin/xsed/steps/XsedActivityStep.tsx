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

// XSED drops include exactly one activity, stored at index 1 of the shared
// `activities` array (index 0 is the dinner — see XsedDinnerStep). Its
// narrative title/content/photos live at sections[2] (see types/xsed.ts).
export function XsedActivityStep({ form, onChange, copy, sectionsCopy, imageCopy }: Props) {
  const dinner = form.activities[0] ?? EMPTY_ENTRY;
  const activity = form.activities[1] ?? EMPTY_ENTRY;

  function handleChange<K extends keyof ActivityEntry>(key: K, value: ActivityEntry[K]) {
    onChange({ activities: [dinner, { ...activity, [key]: value }] });
  }

  function updateSection(patch: Partial<XsedSection>) {
    const sections = form.sections.slice();
    sections[2] = { ...(sections[2] ?? EMPTY_XSED_SECTION), ...patch };
    onChange({ sections });
  }

  return (
    <div className="space-y-6">
      <XsedActivityEntryFields
        idPrefix="xsed-activity"
        namePlaceholder={copy.activityNamePlaceholder}
        entry={activity}
        onChange={handleChange}
        copy={copy}
      />

      <div className="border-t border-gray-100 pt-6">
        <XsedSectionFields
          idPrefix="xsed-activity-section"
          entry={form.sections[2] ?? EMPTY_XSED_SECTION}
          onChange={updateSection}
          copy={sectionsCopy}
          imageCopy={imageCopy}
        />
      </div>
    </div>
  );
}
