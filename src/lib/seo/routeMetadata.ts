import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { buildAlternates, isIndexablePath } from "@/lib/seo/urls";

export function routeMetadata(
  path: string,
  locale: Locale,
  dict: Pick<Dictionary, "blogPage" | "experiences" | "home" | "xsedDropsPage">,
  gateEnabled: boolean,
): Metadata {
  if (!isIndexablePath(path))
    return { robots: { index: false, follow: false } };
  const clean = pathWithoutLocale(path);
  // Titles come from dedicated sentence-case meta keys: the visible hero titles
  // are typed in all caps and would make the search result title shout.
  const indexCopy =
    clean === "/blog"
      ? {
          title: dict.blogPage.meta.title,
          description: dict.blogPage.heroDescription,
        }
      : clean === "/experiences"
        ? {
            title: dict.experiences.meta.title,
            description: dict.experiences.hero.subtitle,
          }
        : clean === "/xsed/drops"
          ? {
              title: dict.xsedDropsPage.meta.title,
              description: dict.xsedDropsPage.description,
            }
          : undefined;
  return {
    alternates: buildAlternates(locale, path),
    // Localized site-wide default; pages that set their own description win.
    description: dict.home.meta.description,
    ...(indexCopy
      ? {
          title: `${indexCopy.title} | Randomtrip`,
          description: indexCopy.description,
        }
      : {}),
    ...(gateEnabled ? { robots: { index: false, follow: false } } : {}),
  };
}
