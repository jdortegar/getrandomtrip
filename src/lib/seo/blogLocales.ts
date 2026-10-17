import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { BlogLocaleSlugs } from "@/types/blog";

/** Locales with a complete public translation, in LOCALES order. */
export function availableBlogLocales(localeSlugs: BlogLocaleSlugs): Locale[] {
  return LOCALES.filter((locale) => localeSlugs[locale] !== undefined);
}

/** Each complete locale's own blog path (`/blog/<that locale's slug>`). */
export function blogLocalePaths(
  localeSlugs: BlogLocaleSlugs,
): Partial<Record<Locale, string>> {
  return Object.fromEntries(
    availableBlogLocales(localeSlugs).map((locale) => [
      locale,
      `/blog/${localeSlugs[locale]}`,
    ]),
  );
}
