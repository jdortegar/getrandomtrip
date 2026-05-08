import type { Metadata } from "next";

import { SecondaryHero } from "@/components/app/xsed/SecondaryHero";
import { CountDown } from "@/components/app/xsed/CountDown";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MultiColumnIconText } from "@/components/app/xsed/MultiColumnIconText";
import Testimonials from "@/components/Testimonials";
import { XSED_TESTIMONIALS } from "@/lib/data/xsed-testimonials";
import { FaqBlock } from "@/components/display/FaqBlock";
import { XsedHero } from "@/components/app/xsed/XsedHero";
import { DropGrid } from "@/components/app/xsed/DropGrid";
import { XSED_DROPS } from "@/lib/data/xsed-drops";

type LocaleParams = { params: Promise<{ locale?: string | string[] }> };

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const params = await props.params;
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

export default async function XsedPage(props: LocaleParams) {
  const params = await props.params;
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const normalizedLocale = hasLocale(locale) ? locale : "es";
  const dict = await getDictionary(normalizedLocale);

  return (
    <>
      <SecondaryHero
        content={dict.xsedPage.hero}
        id="xsed"
        locale={normalizedLocale}
        scrollIndicator
      />
      <CountDown
        copy={dict.xsedPage.countdown}
        locale={normalizedLocale}
        soldCount={2}
        targetDate="2026-10-06T18:00:00-03:00"
        totalSlots={10}
      />
      <DropGrid content={dict.xsedPage.dropGrid} drops={XSED_DROPS} />
      <FaqBlock copy={dict.xsedPage.faq} />
      <MultiColumnIconText content={dict.xsedPage.iconText} />
      <XsedHero content={dict.xsedPage.xsedHero} locale={normalizedLocale} />
      <Testimonials
        content={dict.xsedPage.testimonials}
        featureColor="#D97E4A"
        testimonials={XSED_TESTIMONIALS}
      />
      
    </>
  );
}
