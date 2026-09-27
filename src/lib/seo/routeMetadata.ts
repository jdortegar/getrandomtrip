import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { buildAlternates, isIndexablePath } from "@/lib/seo/urls";

export function routeMetadata(
  path: string,
  locale: Locale,
  dict: Pick<Dictionary, "blogPage" | "experiences" | "xsedDropsPage">,
  gateEnabled: boolean,
): Metadata {
  if (!isIndexablePath(path))
    return { robots: { index: false, follow: false } };
  const clean = pathWithoutLocale(path);
  const indexCopy =
    clean === "/blog"
      ? {
          title: dict.blogPage.heroTitleDefault,
          description: dict.blogPage.heroDescription,
        }
      : clean === "/experiences"
        ? {
            title: dict.experiences.hero.title,
            description: dict.experiences.hero.subtitle,
          }
        : clean === "/xsed/drops"
          ? {
              title: dict.xsedDropsPage.title,
              description: dict.xsedDropsPage.description,
            }
          : undefined;
  return {
    alternates: buildAlternates(locale, path),
    ...(indexCopy
      ? {
          title: `${indexCopy.title} | Randomtrip`,
          description: indexCopy.description,
        }
      : {}),
    ...(gateEnabled ? { robots: { index: false, follow: false } } : {}),
  };
}
