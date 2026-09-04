"use client";

import { FormField } from "@/components/ui/FormField";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { AccommodationEntry, XsedDropDraft, XsedSection } from "@/types/xsed";
import { EMPTY_XSED_SECTION } from "@/types/xsed";
import { XsedSectionFields } from "./XsedSectionFields";
import { XsedContactFields } from "./XsedContactFields";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"]["accommodation"];
  sectionsCopy: AdminXsedDict["form"]["fields"]["sections"];
  imageCopy: Pick<
    AdminXsedDict["form"]["fields"],
    "heroImageSizeHint" | "copyrightHint" | "imageTooSmall"
  >;
  contactCopy: AdminXsedDict["form"]["fields"]["contact"];
}

// XSED drops are single-night — always exactly one accommodation entry, no
// add/remove repeater like the tripper experience form has. Stars and
// nights are hardcoded (see EMPTY_XSED_DRAFT.hotels) rather than exposed
// here — not fields the admin needs to set for a fixed one-night drop. Its
// narrative title/content/photos live at sections[0] (see types/xsed.ts).
export function XsedAccommodationStep({
  form,
  onChange,
  copy,
  sectionsCopy,
  imageCopy,
  contactCopy,
}: Props) {
  function updateEntry(index: number, key: keyof AccommodationEntry, value: string) {
    const updated = form.hotels.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange({ hotels: updated });
  }

  function updateSection(patch: Partial<XsedSection>) {
    const sections = form.sections.slice();
    sections[0] = { ...(sections[0] ?? EMPTY_XSED_SECTION), ...patch };
    onChange({ sections });
  }

  function updateContact(patch: Partial<XsedSection["contact"]>) {
    const current = form.sections[0] ?? EMPTY_XSED_SECTION;
    updateSection({ contact: { ...current.contact, ...patch } });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {form.hotels.map((entry, index) => (
          <div key={index} className="max-w-[calc(50%-0.5rem)]">
            <FormField
              id={`xsed-hotel-name-${index}`}
              label={copy.hotelName}
              placeholder={copy.hotelNamePlaceholder}
              value={entry.hotelName}
              onChange={(e) => updateEntry(index, "hotelName", e.target.value)}
            />
          </div>
        ))}
      </div>

      <XsedContactFields
        idPrefix="xsed-hotel"
        contact={(form.sections[0] ?? EMPTY_XSED_SECTION).contact}
        onChange={updateContact}
        copy={contactCopy}
      />

      <div className="border-t border-gray-100 pt-6">
        <XsedSectionFields
          idPrefix="xsed-hotel-section"
          entry={form.sections[0] ?? EMPTY_XSED_SECTION}
          onChange={updateSection}
          copy={sectionsCopy}
          imageCopy={imageCopy}
        />
      </div>
    </div>
  );
}
