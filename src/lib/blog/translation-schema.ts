import { z } from "zod";
import { CONTENT_LOCALES } from "./locales";

// Size limits shared with the legacy `translations.en` JSON schema
// (content-locale.ts) so both write paths validate identically.
export const shortText = z.string().max(500);
export const mediumText = z.string().max(2_000);
export const richText = z.string().max(500_000);
export const urlText = z.string().max(2_000);
export const faqItemSchema = z.object({
  question: shortText,
  answer: z.string().max(20_000),
});
export const faqSchema = z.object({ items: z.array(faqItemSchema).max(100) });
export const seoSchema = z.object({
  title: shortText.optional(),
  description: mediumText.optional(),
  keywords: z.array(shortText).max(100).optional(),
});

export const blogBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("section"), title: shortText, description: richText }),
  z.object({
    type: z.literal("quote"),
    text: z.string().max(20_000),
    cite: shortText.optional(),
  }),
  z.object({ type: z.literal("paragraph"), text: richText }),
  z.object({ type: z.literal("faq"), items: z.array(faqItemSchema).max(100) }),
  z.object({ type: z.literal("image"), url: urlText, caption: mediumText.optional() }),
  z.object({ type: z.literal("video"), url: urlText, caption: mediumText.optional() }),
  z.object({
    type: z.literal("embed"),
    provider: z.enum(["youtube", "vimeo", "map", "other"]),
    url: urlText,
    title: shortText.optional(),
  }),
]);

/** Client payload for one translation row. Server-owned fields (slug,
 * isComplete, legacy `ready`) are stripped, never trusted. */
export const blogTranslationInputSchema = z.object({
  title: shortText,
  subtitle: mediumText.nullable().optional(),
  tagline: mediumText.nullable().optional(),
  content: richText.nullable().optional(),
  blocks: z.array(blogBlockSchema).max(200).optional(),
  faq: faqSchema.nullable().optional(),
  seo: seoSchema.nullable().optional(),
});

/** Editor payload: translations keyed by supported locale. */
export const blogTranslationsByLocaleSchema = z.partialRecord(
  z.enum(CONTENT_LOCALES),
  blogTranslationInputSchema,
);
