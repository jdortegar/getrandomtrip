import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Hero from "@/components/Hero";

type LocaleParams = { params: Promise<{ locale?: string | string[] }> };

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const params = await props.params;
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const dict = await getDictionary(hasLocale(locale) ? locale : "es");
  const meta = dict.aboutUs.meta;

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

export default async function AboutUsPage(props: LocaleParams) {
  const params = await props.params;
  const raw = params?.locale;
  const localeStr = typeof raw === "string" ? raw : raw?.[0];
  const locale = hasLocale(localeStr) ? localeStr : "es";
  const hero = (await getDictionary(locale)).aboutUs.hero;

  return (
    <div className="bg-white font-barlow text-neutral-900">
     
    </div>
  );
}
