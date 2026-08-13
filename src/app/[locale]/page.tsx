import type { Metadata } from "next";
import { getAllTrippers, getHomepageTestimonials } from "@/lib/db/tripper-queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/og";
import { HomePageClient } from "./HomePageClient";

export async function generateMetadata(props: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const resolvedLocale = hasLocale(locale) ? locale! : "es";
  const dict = await getDictionary(resolvedLocale);
  const meta = dict.home.meta;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://getrandomtrip.com";
  const canonical =
    resolvedLocale === "es" ? siteUrl : `${siteUrl}/${resolvedLocale}`;
  return {
    alternates: { canonical },
    description: meta.description,
    openGraph: {
      description: meta.description,
      images: [DEFAULT_OG_IMAGE],
      title: meta.title,
      type: "website",
    },
    title: meta.title,
  };
}

export default async function HomePage() {
  const [trippers, testimonials] = await Promise.all([
    getAllTrippers(),
    getHomepageTestimonials(),
  ]);
  return <HomePageClient trippers={trippers} testimonials={testimonials} />;
}
