import { SYSTEM_SEGMENT_IDS } from "@/lib/email-campaigns/segmentRules";
import type {
  Campaign,
  CampaignFormField,
  CampaignFormIssues,
  CampaignFormValues,
  CampaignInput,
  CampaignLocale,
  CampaignUpdateInput,
} from "@/types/emailCampaign";

/** Mirrors the limits of `createCampaignSchema` in `src/lib/validation/emailCampaigns.ts`. */
export const CAMPAIGN_FIELD_LIMITS = {
  bodyMarkdown: 20_000,
  ctaLabel: 60,
  ctaUrl: 2_000,
  name: 120,
  preheader: 200,
  promoCode: 64,
  subject: 150,
  title: 150,
} as const satisfies Partial<Record<CampaignFormField, number>>;

type TextField = keyof typeof CAMPAIGN_FIELD_LIMITS;

const REQUIRED_FIELDS: TextField[] = ["name", "subject", "title", "bodyMarkdown"];

export function emptyCampaignForm(locale: CampaignLocale): CampaignFormValues {
  return {
    bodyMarkdown: "",
    ctaLabel: "",
    ctaUrl: "",
    locale,
    name: "",
    preheader: "",
    promoCode: "",
    // New campaigns start targeting the waitlist, as before segments existed.
    segmentIds: [SYSTEM_SEGMENT_IDS.WAITLIST],
    subject: "",
    title: "",
  };
}

export function campaignToForm(campaign: Campaign): CampaignFormValues {
  return {
    bodyMarkdown: campaign.bodyMarkdown,
    ctaLabel: campaign.ctaLabel ?? "",
    ctaUrl: campaign.ctaUrl ?? "",
    locale: campaign.locale,
    name: campaign.name,
    preheader: campaign.preheader ?? "",
    promoCode: campaign.promoCode ?? "",
    segmentIds: campaign.segments.map((segment) => segment.id),
    subject: campaign.subject,
    title: campaign.title,
  };
}

function isAbsoluteHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Client-side checks matching the API schema; empty result means valid. */
export function validateCampaignForm(values: CampaignFormValues): CampaignFormIssues {
  const issues: CampaignFormIssues = {};
  for (const key of Object.keys(CAMPAIGN_FIELD_LIMITS) as TextField[]) {
    // The API trims every text field except the markdown body.
    const value = key === "bodyMarkdown" ? values[key] : values[key].trim();
    if (REQUIRED_FIELDS.includes(key) && !values[key].trim()) {
      issues[key] = { kind: "required" };
    } else if (value.length > CAMPAIGN_FIELD_LIMITS[key]) {
      issues[key] = { kind: "tooLong", max: CAMPAIGN_FIELD_LIMITS[key] };
    }
  }

  const ctaLabel = values.ctaLabel.trim();
  const ctaUrl = values.ctaUrl.trim();
  if (!issues.ctaUrl && ctaUrl && !isAbsoluteHttpsUrl(ctaUrl)) {
    issues.ctaUrl = { kind: "ctaUrl" };
  }
  if (!issues.ctaLabel && !issues.ctaUrl && Boolean(ctaLabel) !== Boolean(ctaUrl)) {
    issues[ctaLabel ? "ctaUrl" : "ctaLabel"] = { kind: "ctaPair" };
  }
  if (values.segmentIds.length === 0) {
    issues.segmentIds = { kind: "segment" };
  }
  return issues;
}

const optional = (value: string) => value.trim() || null;

/** Normalized create payload; mirrors the API's trimming and uppercased code. */
export function formToCampaignInput(values: CampaignFormValues): CampaignInput {
  return {
    bodyMarkdown: values.bodyMarkdown,
    ctaLabel: optional(values.ctaLabel),
    ctaUrl: optional(values.ctaUrl),
    locale: values.locale,
    name: values.name.trim(),
    preheader: optional(values.preheader),
    promoCode: optional(values.promoCode)?.toUpperCase() ?? null,
    segmentIds: values.segmentIds,
    subject: values.subject.trim(),
    title: values.title.trim(),
  };
}

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * PATCH payload with only the fields that differ from the saved campaign, so
 * an unchanged promo code is not re-validated against Stripe. The CTA label
 * and URL are always sent together, as the API requires.
 */
export function campaignChanges(
  campaign: Campaign,
  input: CampaignInput,
): CampaignUpdateInput {
  const changes: CampaignUpdateInput = {};
  const scalarKeys = [
    "name",
    "subject",
    "preheader",
    "title",
    "bodyMarkdown",
    "locale",
    "promoCode",
  ] as const;
  for (const key of scalarKeys) {
    if ((campaign[key] ?? null) !== input[key]) {
      Object.assign(changes, { [key]: input[key] });
    }
  }
  if (
    (campaign.ctaLabel ?? null) !== input.ctaLabel ||
    (campaign.ctaUrl ?? null) !== input.ctaUrl
  ) {
    changes.ctaLabel = input.ctaLabel;
    changes.ctaUrl = input.ctaUrl;
  }
  const savedIds = campaign.segments.map((segment) => segment.id);
  if (!sameIds(savedIds, input.segmentIds)) {
    changes.segmentIds = input.segmentIds;
  }
  return changes;
}
