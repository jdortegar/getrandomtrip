import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/og";
import Hero from "@/components/Hero";
import { AboutUsValues } from "@/components/app/about-us/AboutUsValues";
import { AboutUsPhilosophy } from "@/components/app/about-us/AboutUsPhilosophy";
import { TeamSection } from "@/components/app/about-us/TeamSection";
import { AboutUsSteps } from "@/components/app/about-us/AboutUsSteps";
import { TrustHero } from "@/components/app/about-us/TrustHero";
import { PresentTrippers } from "@/components/app/about-us/PresentTrippers";
import { getAllTrippers } from "@/lib/db/tripper-queries";
import { getTravelerTypeLabel } from "@/lib/helpers/traveler-types";
import { FaqBlock } from "@/components/display/FaqBlock";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQPageSchema } from "@/lib/seo/schemas";

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
      images: [DEFAULT_OG_IMAGE],
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
  const [aboutUs, rawTrippers] = await Promise.all([
    getDictionary(locale).then((d) => d.aboutUs),
    getAllTrippers(),
  ]);

  const trippers = rawTrippers
    .filter((t) => t.tripperSlug)
    .map((t) => ({
      id: t.id,
      avatarUrl: t.avatarUrl,
      bio: t.bio,
      name: t.name,
      specialty: t.travelerType
        ? getTravelerTypeLabel(t.travelerType, locale)
        : null,
      tripperSlug: t.tripperSlug!,
    }));

  return (
    <div className="bg-white font-barlow text-neutral-900">
      <JsonLd schema={buildFAQPageSchema(aboutUs.faq.items)} />
      <Hero content={aboutUs.hero} scrollIndicator />
      <AboutUsValues items={aboutUs.valueProps.items} />
      <AboutUsPhilosophy content={aboutUs.philosophy} id="philosophy" />
      <AboutUsPhilosophy
        content={aboutUs.founder}
        imageSrc="/images/about-us-santiago.png"
        inverted
        imageClassName="object-top"
      />
      <TeamSection content={aboutUs.curators} />
      <AboutUsSteps content={aboutUs.steps} cta={aboutUs.cta} locale={locale} />
      <TrustHero content={aboutUs.trust} locale={locale} />
      <PresentTrippers content={aboutUs.presentTrippers} trippers={trippers} />
      <FaqBlock copy={aboutUs.faq} />
    </div>
  );
}
