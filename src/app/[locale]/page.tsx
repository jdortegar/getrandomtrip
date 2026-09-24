import type { Metadata } from "next";
import { headers } from "next/headers";
import { GeoWelcomeToast } from "@/components/landing/GeoWelcomeToast";
import {
  getWelcomeCountryName,
  resolveWelcomeCountry,
} from "@/lib/geo/welcome";
import { getWelcomeFlagSvg } from "@/lib/geo/welcome-flag.server";
import {
  getAllTrippers,
  getHomepageTestimonials,
  getRecentPublishedBlogs,
} from "@/lib/db/tripper-queries";
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

export default async function HomePage(props: {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{ country?: string | string[] }>;
}) {
  const { locale } = await props.params;
  const resolvedLocale = hasLocale(locale) ? locale : "es";
  const [trippers, testimonials, blogPosts, dict, requestHeaders, query] =
    await Promise.all([
      getAllTrippers(),
      getHomepageTestimonials(),
      getRecentPublishedBlogs(5, resolvedLocale),
      getDictionary(resolvedLocale),
      headers(),
      props.searchParams,
    ]);

  // Netlify's CDN sets x-country (IP-based ISO code); it is absent locally,
  // so ?country=XX stands in for it outside production.
  const welcomeCountry = resolveWelcomeCountry({
    allowOverride: process.env.NODE_ENV !== "production",
    headerCountry: requestHeaders.get("x-country"),
    overrideCountry: typeof query.country === "string" ? query.country : null,
  });

  return (
    <>
      {welcomeCountry ? (
        <GeoWelcomeToast
          countryCode={welcomeCountry}
          flagSvg={getWelcomeFlagSvg(welcomeCountry)}
          message={dict.home.geoWelcome.message.replace(
            "{country}",
            getWelcomeCountryName(welcomeCountry, resolvedLocale),
          )}
        />
      ) : null}
      <HomePageClient
        trippers={trippers}
        testimonials={testimonials}
        blogPosts={blogPosts}
      />
    </>
  );
}
