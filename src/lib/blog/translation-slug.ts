import { z } from "zod";
import { slugify } from "@/lib/helpers/slugify";
import { CONTENT_LOCALES } from "./locales";

const FALLBACK_SLUG = "post";
const DEFAULT_MAX_ATTEMPTS = 1000;

/** Slug derived from a translation's own title. Diacritics are folded first so
 * Spanish titles keep readable slugs ("Perú" → "peru", not "per"). */
export function slugForTitle(title: string): string {
  const folded = title.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return slugify(folded) || FALLBACK_SLUG;
}

/** First free slug among `base`, `base-2`, `base-3`… `isTaken` is injected so
 * callers decide the uniqueness scope (per locale) and this stays pure. */
export async function resolveUniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
  { maxAttempts = DEFAULT_MAX_ATTEMPTS }: { maxAttempts?: number } = {},
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error(
    `Could not resolve a unique slug for "${base}" after ${maxAttempts} attempts`,
  );
}

/** Slugs follow the title until the post is first published, then stay frozen
 * (old URLs are SEO assets) unless an editor explicitly regenerates them. */
export function shouldRegenerateSlug({
  publishedAt,
  explicitRegenerate = false,
}: {
  publishedAt?: Date | string | null;
  explicitRegenerate?: boolean;
}): boolean {
  return explicitRegenerate || !publishedAt;
}

/** Optional PATCH field: `{ [locale]: true }` regenerates that locale's
 * frozen (published) slug from its current title. */
export const regenerateSlugInputSchema = z.partialRecord(
  z.enum(CONTENT_LOCALES),
  z.boolean(),
);

export type RegenerateSlugInput = z.infer<typeof regenerateSlugInputSchema>;
