import { slugify } from "@/lib/helpers/slugify";

const FALLBACK_SLUG = "post";
const DEFAULT_MAX_ATTEMPTS = 1000;

/** Slug derived from a translation's own title. Diacritics are folded first so
 * Spanish titles keep readable slugs ("Perú" → "peru", not "per"). */
export function slugForTitle(title: string): string {
  return slugify(title.normalize("NFD").replace(/[̀-ͯ]/g, "")) || FALLBACK_SLUG;
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
