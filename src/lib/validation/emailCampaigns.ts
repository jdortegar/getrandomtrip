import { z } from "zod";

import {
  MAX_SEGMENT_DESCRIPTION_LENGTH,
  MAX_SEGMENT_NAME_LENGTH,
} from "@/lib/email-campaigns/segmentRules";
import { isValidEmail } from "@/lib/validation/email";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_NAME_LENGTH = 120;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 20;

const contactSourceSchema = z.enum(["WAITLIST", "FRIENDS_FAMILY"]);
const contactStatusSchema = z.enum(["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED"]);
const contactLocaleSchema = z.enum(["es", "en"]);
const contactNameSchema = z.string().trim().max(MAX_NAME_LENGTH).nullable();
const contactTagsSchema = z
  .array(z.string().max(MAX_TAG_LENGTH))
  .max(MAX_TAGS);

const MAX_SEGMENT_ID_LENGTH = 64;
const MAX_SEGMENT_IDS = 100;

/** Trimmed, de-duplicated segment ids; existence is checked by the repository. */
const segmentIdsSchema = z
  .array(z.string().trim().min(1).max(MAX_SEGMENT_ID_LENGTH))
  .max(MAX_SEGMENT_IDS)
  .transform((ids) => [...new Set(ids)]);

/** Same paging rules as the admin waitlist list: bad values fall back. */
const positiveInt = (fallback: number) =>
  z
    .string()
    .nullish()
    .transform((value) => {
      const parsed = Math.trunc(Number(value));
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
    });

export const contactListQuerySchema = z.object({
  page: positiveInt(1),
  limit: positiveInt(DEFAULT_LIMIT).transform((n) => Math.min(MAX_LIMIT, n)),
  source: contactSourceSchema.optional(),
  status: contactStatusSchema.optional(),
  segmentId: z
    .string()
    .trim()
    .max(MAX_SEGMENT_ID_LENGTH)
    .optional()
    .transform((value) => value || undefined),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
});

export const createContactSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .refine(isValidEmail, { message: "Invalid email" }),
  name: contactNameSchema.optional(),
  locale: contactLocaleSchema.optional(),
  tags: contactTagsSchema.optional(),
  segmentIds: segmentIdsSchema.optional(),
});

export const updateContactSchema = z
  .object({
    name: contactNameSchema.optional(),
    locale: contactLocaleSchema.optional(),
    tags: contactTagsSchema.optional(),
    status: contactStatusSchema.optional(),
    segmentIds: segmentIdsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  });

const MAX_CAMPAIGN_NAME_LENGTH = 120;
const MAX_SUBJECT_LENGTH = 150;
const MAX_PREHEADER_LENGTH = 200;
const MAX_TITLE_LENGTH = 150;
const MAX_BODY_LENGTH = 20_000;
const MAX_CTA_LABEL_LENGTH = 60;
const MAX_CTA_URL_LENGTH = 2_000;
const MAX_PROMO_CODE_LENGTH = 64;

const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** Optional text: missing, `null` and blank all become `null`. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

function isAbsoluteHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const ctaUrlSchema = optionalText(MAX_CTA_URL_LENGTH).refine(
  (value) => value === null || isAbsoluteHttpsUrl(value),
  { message: "CTA URL must be an absolute https URL" },
);

/** Checkout uppercases typed codes; blank means "no promo". */
const promoCodeSchema = optionalText(MAX_PROMO_CODE_LENGTH).transform(
  (value) => value?.toUpperCase() ?? null,
);

const campaignFields = {
  name: requiredText(MAX_CAMPAIGN_NAME_LENGTH),
  subject: requiredText(MAX_SUBJECT_LENGTH),
  preheader: optionalText(MAX_PREHEADER_LENGTH),
  title: requiredText(MAX_TITLE_LENGTH),
  bodyMarkdown: z
    .string()
    .max(MAX_BODY_LENGTH)
    .refine((value) => value.trim().length > 0, { message: "Body is required" }),
  ctaLabel: optionalText(MAX_CTA_LABEL_LENGTH),
  ctaUrl: ctaUrlSchema,
  locale: contactLocaleSchema,
  segmentIds: segmentIdsSchema.refine((ids) => ids.length > 0, {
    message: "Select at least one segment",
  }),
  promoCode: promoCodeSchema,
};

const ctaPairMessage = { message: "CTA label and URL go together" };

export const createCampaignSchema = z
  .object(campaignFields)
  .strict()
  .refine((value) => Boolean(value.ctaLabel) === Boolean(value.ctaUrl), ctaPairMessage);

/**
 * Partial DRAFT edit. The CTA label and URL are sent together (both set or
 * both cleared) so the pair can be validated without reading the row.
 */
export const updateCampaignSchema = z
  .object(campaignFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  })
  .refine(
    (value) =>
      !("ctaLabel" in value || "ctaUrl" in value) ||
      ("ctaLabel" in value &&
        "ctaUrl" in value &&
        Boolean(value.ctaLabel) === Boolean(value.ctaUrl)),
    ctaPairMessage,
  );

const segmentFields = {
  name: requiredText(MAX_SEGMENT_NAME_LENGTH),
  description: optionalText(MAX_SEGMENT_DESCRIPTION_LENGTH),
};

export const createSegmentSchema = z.object(segmentFields).strict();

/** Rename and / or describe; `description: null` or blank clears it. */
export const updateSegmentSchema = z
  .object({
    name: segmentFields.name.optional(),
    description: z
      .string()
      .trim()
      .max(MAX_SEGMENT_DESCRIPTION_LENGTH)
      .nullable()
      .optional()
      .transform((value) => (value === undefined ? undefined : value || null)),
  })
  .strict()
  .transform((value) =>
    Object.fromEntries(
      Object.entries(value).filter(([, field]) => field !== undefined),
    ) as { name?: string; description?: string | null },
  )
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  });

export const promoLookupQuerySchema = z.object({
  code: requiredText(MAX_PROMO_CODE_LENGTH).transform((value) =>
    value.toUpperCase(),
  ),
});
