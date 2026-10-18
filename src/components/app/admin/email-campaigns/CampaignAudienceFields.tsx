"use client";

import Chip from "@/components/Chip";
import { FormSelectField } from "@/components/ui/FormField";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type {
  CampaignFormValues,
  CampaignLocale,
  ContactSource,
} from "@/types/emailCampaign";
import { PromoCodeLookup } from "./PromoCodeLookup";

const SOURCES: ContactSource[] = ["WAITLIST", "FRIENDS_FAMILY"];

interface CampaignAudienceFieldsProps {
  copy: EmailCampaignsAdminDict["editor"];
  /** BCP 47 locale for dates and money, e.g. `es-ES`. */
  dateLocale: string;
  localeLabels: EmailCampaignsAdminDict["locales"];
  onLocaleChange: (locale: CampaignLocale) => void;
  onPromoCodeChange: (value: string) => void;
  onToggleSource: (source: ContactSource) => void;
  /** Localized segment error, shown under the chips. */
  segmentError?: string;
  sourceLabels: EmailCampaignsAdminDict["contacts"]["source"];
  values: CampaignFormValues;
}

/** Audience inputs of the campaign editor: locale, segment sources and promo code. */
export function CampaignAudienceFields({
  copy,
  dateLocale,
  localeLabels,
  onLocaleChange,
  onPromoCodeChange,
  onToggleSource,
  segmentError,
  sourceLabels,
  values,
}: CampaignAudienceFieldsProps) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-4 text-xl font-semibold text-ink">{copy.audienceHeading}</legend>
      <div className="grid gap-5 md:grid-cols-2">
        <FormSelectField
          id="campaign-locale"
          label={copy.fields.locale}
          name="locale"
          onChange={(event) => onLocaleChange(event.target.value as CampaignLocale)}
          value={values.locale}
        >
          <option value="es">{localeLabels.es}</option>
          <option value="en">{localeLabels.en}</option>
        </FormSelectField>
        <div
          aria-describedby="campaign-segment-hint"
          aria-labelledby="campaign-segment-label"
          className="flex flex-col gap-2"
          role="group"
        >
          <span className="text-base text-gray-600" id="campaign-segment-label">
            {copy.fields.segment}
          </span>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((source) => (
              <Chip
                active={values.segmentSources.includes(source)}
                key={source}
                onClick={() => onToggleSource(source)}
                size="touch"
              >
                {sourceLabels[source]}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-neutral-500" id="campaign-segment-hint">
            {copy.fields.segmentHint}
          </p>
          {segmentError && <p className="text-sm text-red-700">{segmentError}</p>}
        </div>
      </div>
      <PromoCodeLookup
        copy={copy.promo}
        dateLocale={dateLocale}
        onChange={onPromoCodeChange}
        value={values.promoCode}
      />
    </fieldset>
  );
}
