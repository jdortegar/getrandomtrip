import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";
import { pathForLocale, pathWithoutLocale } from "@/lib/i18n/pathForLocale";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://getrandomtrip.com"
).replace(/\/+$/, "");

export function canonicalUrl(locale: Locale, path = "/"): string {
  const clean = pathWithoutLocale(path.split(/[?#]/)[0] || "/");
  const localized = pathForLocale(locale, clean).replace(/\/+$/, "");
  return `${SITE_URL}${localized}`;
}

export function buildAlternates(
  locale: Locale,
  path: string,
  available: readonly Locale[] = LOCALES,
) {
  return {
    canonical: canonicalUrl(locale, path),
    languages: Object.fromEntries(
      available.map((language) => [language, canonicalUrl(language, path)]),
    ),
  };
}

/** An allowlist keeps future account/token routes non-indexable by default. */
export function isIndexablePath(path: string): boolean {
  const clean = pathWithoutLocale(path).replace(/\/+$/, "") || "/";
  return (
    /^\/(?:|about-us|blog|contact|cookies|experiences|faq|privacy|refund|terms|trippers|xsed|xsed\/drops)$/.test(
      clean,
    ) ||
    /^\/(?:blog|trippers)\/[^/]+$/.test(clean) ||
    /^\/experiences\/(?:by-tripper\/[^/]+|by-type\/(?:couple|solo|family|group|honeymoon|paws))$/.test(
      clean,
    )
  );
}

export { DEFAULT_LOCALE };
