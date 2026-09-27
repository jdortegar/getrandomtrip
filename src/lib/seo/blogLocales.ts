import { resolveBlogContent } from "@/lib/blog/content-locale";
import type { Locale } from "@/lib/i18n/config";

/** Match both the public English query's persisted readiness and usable copy. */
export function availableBlogLocales(post: {
  translations?: unknown;
}): Locale[] {
  const translations = post.translations as
    | { en?: { ready?: boolean } }
    | undefined;
  return translations?.en?.ready === true && resolveBlogContent(post, "en")
    ? ["es", "en"]
    : ["es"];
}
