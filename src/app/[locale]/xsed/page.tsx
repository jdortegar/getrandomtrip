import type { Metadata } from "next";

import { SecondaryHero } from "@/components/app/xsed/SecondaryHero";
import { CountDown } from "@/components/app/xsed/CountDown";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MultiColumnIconText } from "@/components/app/xsed/MultiColumnIconText";
import Testimonials from "@/components/Testimonials/Testimonials";
import { XSED_TESTIMONIALS } from "@/lib/data/xsed-testimonials";
import { FaqBlock } from "@/components/display/FaqBlock";
import { XsedHero } from "@/components/app/xsed/XsedHero";
import { DropGrid } from "@/components/app/xsed/DropGrid";
import {
  getCurrentXsedDrop,
  getXsedDropsForGrid,
} from "@/lib/data/xsed";

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
  const currentDrop = await getCurrentXsedDrop();
  const allGridDrops = await getXsedDropsForGrid(
    currentDrop?.id ?? null,
    normalizedLocale,
  );
  const gridDrops = allGridDrops.slice(0, 5);

  return (
    <>
      <SecondaryHero
        content={dict.xsedPage.hero}
        id="xsed"
        locale={normalizedLocale}
        scrollIndicator
      />
      {currentDrop ? (
        <CountDown
          copy={dict.xsedPage.countdown}
          locale={normalizedLocale}
          number={currentDrop.number}
          soldCount={currentDrop.soldCount}
          targetDate={currentDrop.targetDate}
          totalSlots={currentDrop.totalSlots}
        />
      ) : null}
      <MultiColumnIconText content={dict.xsedPage.iconText} />
      <DropGrid content={dict.xsedPage.dropGrid} drops={gridDrops} />
      <FaqBlock copy={dict.xsedPage.faq} />

      <XsedHero content={dict.xsedPage.xsedHero} locale={normalizedLocale} />
      <Testimonials
        title={dict.xsedPage.testimonials.title}
        subtitle={dict.xsedPage.testimonials.subtitle}
        eyebrow={dict.xsedPage.testimonials.eyebrow}
        viewFullReviewLabel={dict.xsedPage.testimonials.viewFullReviewLabel}
        featureColor="#D97E4A"
        testimonials={XSED_TESTIMONIALS}
      /> 
    </>
  );
}
