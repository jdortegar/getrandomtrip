"use client";

import { Check } from "lucide-react";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from "@/types/tripper";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

export function VisibilityStep({ copy, form, onChange }: Props) {
  const { fields } = copy;
  const checked = form.createBlogPost;

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[3]?.substeps[1]?.description}
      </p>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange("createBlogPost", e.target.checked)}
            className="peer sr-only"
          />
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${
              checked
                ? "border-blue-500 bg-blue-500"
                : "border-gray-300 bg-white"
            }`}
          >
            {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </div>
        </div>

        <div>
          <p className="font-normal text-gray-600 text-base">
            {fields.createBlogPost}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {fields.createBlogPostHint}
          </p>
        </div>
      </label>
    </div>
  );
}
