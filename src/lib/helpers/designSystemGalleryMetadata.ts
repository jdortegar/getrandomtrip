import type { Metadata } from "next";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

export function designSystemGalleryMetadata(locale: Locale): Metadata {
  return {
    alternates: {
      types: {
        "text/markdown": pathForLocale(locale, "/design-system/llms"),
      },
    },
    robots: { index: false, follow: false },
  };
}
