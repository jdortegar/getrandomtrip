"use client";

import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
}

export function FeatureQuoteStep({ copy, draft, onChange }: Props) {
  const { fields } = copy;

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[1]?.description}
      </p>

      <TextAreaInput
        id="blog-feature-text"
        label={fields.featureText}
        maxLength={280}
        onChange={(e) => onChange("featureText", e.target.value)}
        placeholder={fields.featureTextPlaceholder}
        value={draft.featureText}
      />

      <FormField
        id="blog-feature-attribution"
        label={fields.featureAttribution}
        onChange={(e) => onChange("featureAttribution", e.target.value)}
        placeholder={fields.featureAttributionPlaceholder}
        value={draft.featureAttribution}
      />
    </div>
  );
}
