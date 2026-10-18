"use client";

import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { CampaignFormValues } from "@/types/emailCampaign";
import { CAMPAIGN_FIELD_LIMITS } from "./campaignForm";

type ContentField = Exclude<
  keyof CampaignFormValues,
  "locale" | "segmentSources" | "promoCode"
>;

interface CampaignContentFieldsProps {
  copy: EmailCampaignsAdminDict["editor"];
  onChange: (field: ContentField, value: string) => void;
  values: CampaignFormValues;
}

/** Email content inputs of the campaign editor: labels, copy and the CTA pair. */
export function CampaignContentFields({ copy, onChange, values }: CampaignContentFieldsProps) {
  const fields = copy.fields;
  const text = (field: ContentField, id: string, label: string, extra = {}) => (
    <FormField
      autoComplete="off"
      id={id}
      label={label}
      maxLength={CAMPAIGN_FIELD_LIMITS[field]}
      name={field}
      onChange={(event) => onChange(field, event.target.value)}
      value={values[field]}
      {...extra}
    />
  );

  return (
    <fieldset className="space-y-5">
      <legend className="mb-4 text-xl font-semibold text-ink">{copy.contentHeading}</legend>
      <div className="grid gap-5 md:grid-cols-2">
        {text("name", "campaign-name", fields.name)}
        {text("subject", "campaign-subject", fields.subject)}
        {text("preheader", "campaign-preheader", fields.preheader)}
        {text("title", "campaign-title", fields.title)}
      </div>
      <div className="space-y-2">
        <TextAreaInput
          aria-describedby="campaign-body-hint"
          className="min-h-[280px] font-mono text-sm"
          id="campaign-body"
          label={fields.body}
          maxLength={CAMPAIGN_FIELD_LIMITS.bodyMarkdown}
          name="bodyMarkdown"
          onChange={(event) => onChange("bodyMarkdown", event.target.value)}
          value={values.bodyMarkdown}
        />
        <p className="text-xs text-neutral-500" id="campaign-body-hint">
          {fields.bodyHint}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {text("ctaLabel", "campaign-cta-label", fields.ctaLabel)}
        {text("ctaUrl", "campaign-cta-url", fields.ctaUrl, {
          inputMode: "url",
          placeholder: fields.ctaUrlPlaceholder,
          type: "url",
        })}
      </div>
    </fieldset>
  );
}
