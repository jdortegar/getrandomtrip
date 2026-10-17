import { z } from "zod";

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

/** Same paging rules as the admin waitlist list: bad values fall back. */
const positiveInt = (fallback: number) =>
  z
    .string()
    .nullish()
    .transform((value) => Math.max(1, Math.trunc(Number(value)) || fallback));

export const contactListQuerySchema = z.object({
  page: positiveInt(1),
  limit: positiveInt(DEFAULT_LIMIT).transform((n) => Math.min(MAX_LIMIT, n)),
  source: contactSourceSchema.optional(),
  status: contactStatusSchema.optional(),
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
});

export const updateContactSchema = z
  .object({
    name: contactNameSchema.optional(),
    locale: contactLocaleSchema.optional(),
    tags: contactTagsSchema.optional(),
    status: contactStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  });
