import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";
import type { ContentLocale } from "@/types/blog";

/** Locales a blog translation row may use. Mirrors the SQL CHECK constraint on
 * blog_post_translations.locale / blog_post_slug_history.locale. */
export const CONTENT_LOCALES = LOCALES;

export const contentLocaleSchema = z.enum(CONTENT_LOCALES);

export function isContentLocale(value: unknown): value is ContentLocale {
  return (
    typeof value === "string" &&
    (CONTENT_LOCALES as readonly string[]).includes(value)
  );
}
