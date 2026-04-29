import type { Metadata } from "next";

import { SecondaryHero } from "@/components/app/xsed/SecondaryHero";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type LocaleParams = { params: { locale?: string | string[] } };

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const dict = await getDictionary(hasLocale(locale) ? locale : "es");
  const meta = dict.xsedPage.meta;

  return {
    description: meta.description,
    openGraph: {
      description: meta.openGraphDescription,
      title: meta.openGraphTitle,
      type: "website",
    },
    title: meta.title,
  };
}

export default async function XsedPage({ params }: LocaleParams) {
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const dict = await getDictionary(hasLocale(locale) ? locale : "es");

  return <SecondaryHero content={dict.xsedPage.hero} id="xsed" />;
}
