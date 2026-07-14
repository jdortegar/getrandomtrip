"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { RichTextInput } from "@/components/ui/RichTextInput";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
}

const EMPTY_SECTION = { title: "", description: "" };

export function SectionsStep({ copy, draft, onChange }: Props) {
  const { fields } = copy;

  function updateSection(index: number, key: "title" | "description", value: string) {
    const updated = draft.sections.map((s, i) => (i === index ? { ...s, [key]: value } : s));
    onChange("sections", updated);
  }

  function addSection() {
    onChange("sections", [...draft.sections, { ...EMPTY_SECTION }]);
  }

  function removeSection(index: number) {
    onChange(
      "sections",
      draft.sections.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[1]?.substeps[0]?.description}
      </p>

      <div className="space-y-6">
        {draft.sections.map((section, index) => (
          <div className="space-y-4" key={index}>
            {index > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-neutral-500">
                  {fields.sectionLabel} {index + 1}
                </span>
                <button
                  className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-red-500"
                  onClick={() => removeSection(index)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                  {fields.removeSection}
                </button>
              </div>
            )}

            <FormField
              id={`section-title-${index}`}
              label={`${fields.sectionTitle} ${index + 1}`}
              onChange={(e) => updateSection(index, "title", e.target.value)}
              placeholder={fields.sectionTitlePlaceholder}
              value={section.title}
            />

            <RichTextInput
              id={`section-description-${index}`}
              label={fields.sectionDescription}
              onChange={(html) => updateSection(index, "description", html)}
              placeholder={fields.sectionDescriptionPlaceholder}
              value={section.description}
            />
          </div>
        ))}
      </div>

      <button
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 transition-colors hover:border-gray-400 hover:text-neutral-700"
        onClick={addSection}
        type="button"
      >
        + {fields.addSection}
      </button>
    </div>
  );
}
