import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale, pathWithoutLocale } from "@/lib/i18n/pathForLocale";

/** Localize internal page links without rewriting external, fragment or API URLs. */
export function localizeHref(locale: string, href: string): string {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    /^\/(?:api|_next)(?:\/|$)/.test(href)
  )
    return href;
  const [, path, suffix = ""] = href.match(/^([^?#]*)(.*)$/)!;
  const localized = pathForLocale(
    hasLocale(locale) ? locale : "es",
    pathWithoutLocale(path),
  );
  return `${localized.replace(/\/$/, "") || "/"}${suffix}`;
}
