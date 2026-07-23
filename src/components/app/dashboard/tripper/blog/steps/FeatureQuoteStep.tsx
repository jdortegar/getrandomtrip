"use client";

import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";
import type { FieldPeek } from "@/components/ui/field-peek";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
  changedFieldSet?: Set<string>;
  /** Builds the peek toggle for an eligible field; `undefined` when peek is not available. */
  peek?: (field: keyof BlogFormDraft, diffKey?: string) => FieldPeek | undefined;
}

export function FeatureQuoteStep({ copy, draft, onChange, changedFieldSet, peek }: Props) {
  const { fields } = copy;
  // featureText/featureAttribution are both folded into the server-side
  // "blocks" column (the quote block) — see MUTABLE_BLOG_FIELDS in
  // src/lib/blog/changed-fields.ts — so they're gated by "blocks", not their
  // own form-field name.
  const blocksRing = changedFieldSet?.has("blocks") ? "ring-2 ring-amber-400 rounded-xl" : undefined;

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
        className={blocksRing}
        peek={peek?.("featureText", "blocks")}
      />

      <FormField
        id="blog-feature-attribution"
        label={fields.featureAttribution}
        onChange={(e) => onChange("featureAttribution", e.target.value)}
        placeholder={fields.featureAttributionPlaceholder}
        value={draft.featureAttribution}
        className={blocksRing}
        peek={peek?.("featureAttribution", "blocks")}
      />
    </div>
  );
}
